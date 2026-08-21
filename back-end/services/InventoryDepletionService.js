// back-end/services/inventoryDepletionService.js
const Recipe = require('../models/Recipe');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

/**
 * Pre-validates if branch has sufficient raw ingredients before committing the order.
 * Takes cooking yield/shrinkage loss factors into account.
 * @throws Error with detailed list of missing ingredients if insufficient stock.
 */
const validateStockAvailability = async ({ orderItems, branchId, session }) => {
  const requirements = new Map(); // itemId -> { name, requiredQty, unit }

  for (const lineItem of orderItems) {
    const productId = lineItem.product?._id || lineItem.product;
    const qty = Number(lineItem.quantity) || 1;

    if (!productId) continue;

    const recipe = await Recipe.findOne({ product: productId, isActive: { $ne: false } })
      .populate('ingredients.inventoryItem')
      .session(session);

    if (!recipe || !recipe.ingredients) continue;

    for (const ing of recipe.ingredients) {
      const item = ing.inventoryItem;
      if (!item) continue;

      const itemIdStr = item._id.toString();
      const yieldFactor = (Number(ing.yieldPercentage) || 100) / 100;
      // Calculate true raw gross required to fulfill net recipe requirement
      const grossNeededPerUnit = Number(ing.quantityRequired) / yieldFactor;
      const needed = Number((grossNeededPerUnit * qty).toFixed(4));

      if (requirements.has(itemIdStr)) {
        requirements.get(itemIdStr).requiredQty += needed;
      } else {
        requirements.set(itemIdStr, {
          id: item._id,
          name: item.name,
          unit: item.recipeUnit,
          requiredQty: needed,
        });
      }
    }
  }

  const outOfStockItems = [];

  for (const [, req] of requirements) {
    const itemDoc = await InventoryItem.findById(req.id).session(session);
    const branchStock = itemDoc?.branchStocks?.find(
      (bs) => bs.branch.toString() === branchId.toString()
    );

    const available = branchStock?.currentStock || 0;
    if (available < req.requiredQty) {
      outOfStockItems.push({
        ingredient: req.name,
        required: Number(req.requiredQty.toFixed(2)),
        available: Number(available.toFixed(2)),
        unit: req.unit,
        shortage: Number((req.requiredQty - available).toFixed(2)),
      });
    }
  }

  if (outOfStockItems.length > 0) {
    const error = new Error('INSUFFICIENT_STOCK');
    error.details = outOfStockItems;
    throw error;
  }

  return true;
};

/**
 * Validates and deducts raw gross inventory ingredients for items in an order.
 */
const depleteInventoryForOrder = async ({
  orderItems,
  branchId,
  orderNumber,
  userId = null,
  session,
}) => {
  // 1. Guard check: abort if ingredients are missing/insufficient
  await validateStockAvailability({ orderItems, branchId, session });

  const stockDeductionPlan = new Map(); // Key: itemId -> { itemDoc, totalQtyToDeduct }
  const ledgerEntries = [];

  for (const lineItem of orderItems) {
    const productId = lineItem.product?._id || lineItem.product;
    const orderedQty = Number(lineItem.quantity) || 1;

    if (!productId) continue;

    const recipe = await Recipe.findOne({ product: productId, isActive: { $ne: false } })
      .populate('ingredients.inventoryItem')
      .session(session);

    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      continue;
    }

    for (const ing of recipe.ingredients) {
      const invItem = ing.inventoryItem;
      if (!invItem) continue;

      const itemIdStr = invItem._id.toString();
      const yieldFactor = (Number(ing.yieldPercentage) || 100) / 100;
      const rawGrossRequired = Number(((Number(ing.quantityRequired) / yieldFactor) * orderedQty).toFixed(4));

      if (stockDeductionPlan.has(itemIdStr)) {
        stockDeductionPlan.get(itemIdStr).totalQtyToDeduct += rawGrossRequired;
      } else {
        stockDeductionPlan.set(itemIdStr, {
          itemDoc: invItem,
          totalQtyToDeduct: rawGrossRequired,
        });
      }
    }
  }

  // 2. Execute branch deductions & build ledger records
  for (const [, plan] of stockDeductionPlan) {
    const { itemDoc, totalQtyToDeduct } = plan;
    const roundedDeduction = Number(totalQtyToDeduct.toFixed(2));

    const freshItem = await InventoryItem.findById(itemDoc._id).session(session);
    if (!freshItem) continue;

    let branchStock = freshItem.branchStocks.find(
      (bs) => bs.branch.toString() === branchId.toString()
    );

    if (!branchStock) {
      freshItem.branchStocks.push({
        branch: branchId,
        currentStock: 0,
        reorderLevel: 500,
        idealStock: 5000,
      });
      branchStock = freshItem.branchStocks[freshItem.branchStocks.length - 1];
    }

    const previousStock = branchStock.currentStock;
    const newStock = Math.max(0, Number((previousStock - roundedDeduction).toFixed(2)));

    branchStock.currentStock = newStock;
    await freshItem.save({ session });

    ledgerEntries.push({
      item: freshItem._id,
      branch: branchId,
      type: 'SALE_OUTWARD',
      quantityChanged: -roundedDeduction,
      previousStock,
      newStock,
      unitCostAtTime: freshItem.costPerRecipeUnit || 0,
      totalMonetaryValue: Number((roundedDeduction * (freshItem.costPerRecipeUnit || 0)).toFixed(2)),
      performedBy: userId,
      notes: `Order Depletion: ${orderNumber}`,
    });
  }

  if (ledgerEntries.length > 0) {
    await StockTransaction.insertMany(ledgerEntries, { session });
  }

  return { success: true, ingredientsDepleted: ledgerEntries.length };
};

/**
 * Reverses inventory deductions if an order is cancelled or refunded.
 */
const restoreInventoryForOrder = async ({
  orderItems,
  branchId,
  orderNumber,
  userId = null,
  session,
}) => {
  for (const lineItem of orderItems) {
    const productId = lineItem.product?._id || lineItem.product;
    const orderedQty = Number(lineItem.quantity) || 1;

    const recipe = await Recipe.findOne({ product: productId }).session(session);
    if (!recipe || !recipe.ingredients) continue;

    for (const ing of recipe.ingredients) {
      const invItem = await InventoryItem.findById(ing.inventoryItem).session(session);
      if (!invItem) continue;

      const branchStock = invItem.branchStocks.find(
        (bs) => bs.branch.toString() === branchId.toString()
      );
      if (!branchStock) continue;

      const yieldFactor = (Number(ing.yieldPercentage) || 100) / 100;
      const rawGrossReturn = Number(((Number(ing.quantityRequired) / yieldFactor) * orderedQty).toFixed(2));
      const previousStock = branchStock.currentStock;
      const newStock = Number((previousStock + rawGrossReturn).toFixed(2));

      branchStock.currentStock = newStock;
      await invItem.save({ session });

      const rollbackEntry = new StockTransaction({
        item: invItem._id,
        branch: branchId,
        type: 'SALE_RETURN',
        quantityChanged: rawGrossReturn,
        previousStock,
        newStock,
        unitCostAtTime: invItem.costPerRecipeUnit || 0,
        totalMonetaryValue: Number((rawGrossReturn * (invItem.costPerRecipeUnit || 0)).toFixed(2)),
        performedBy: userId,
        notes: `Order Cancelled Rollback: ${orderNumber}`,
      });

      await rollbackEntry.save({ session });
    }
  }
};

module.exports = {
  validateStockAvailability,
  depleteInventoryForOrder,
  restoreInventoryForOrder,
};