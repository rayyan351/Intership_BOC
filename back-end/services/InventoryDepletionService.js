// back-end/services/inventoryDepletionService.js
const Recipe = require('../models/Recipe');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

/**
 * Validates and deducts raw inventory ingredients for items in an order.
 * @param {Array} orderItems - Array of { product: productId, quantity: number }
 * @param {String} branchId - The branch fulfilling the order
 * @param {String} orderNumber - For audit tracking
 * @param {String} userId - User or System executing the order
 * @param {Object} session - Mongoose ACID transaction session
 */
const depleteInventoryForOrder = async ({
  orderItems,
  branchId,
  orderNumber,
  userId = null,
  session,
}) => {
  const stockDeductionPlan = new Map(); // Key: itemId -> { itemDoc, totalQtyToDeduct }
  const ledgerEntries = [];

  for (const lineItem of orderItems) {
    const productId = lineItem.product?._id || lineItem.product;
    const orderedQty = Number(lineItem.quantity) || 1;

    if (!productId) continue;

    // Fetch the Bill of Materials for this product
    const recipe = await Recipe.findOne({ product: productId })
      .populate('ingredients.inventoryItem')
      .session(session);

    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      // Product has no BOM defined (e.g. merchandise or raw retail item)
      continue;
    }

    // Accumulate total raw materials required
    for (const ing of recipe.ingredients) {
      const invItem = ing.inventoryItem;
      if (!invItem) continue;

      const itemIdStr = invItem._id.toString();
      const unitRequired = Number(ing.quantityRequired) * orderedQty;

      if (stockDeductionPlan.has(itemIdStr)) {
        const existing = stockDeductionPlan.get(itemIdStr);
        existing.totalQtyToDeduct += unitRequired;
      } else {
        stockDeductionPlan.set(itemIdStr, {
          itemDoc: invItem,
          totalQtyToDeduct: unitRequired,
        });
      }
    }
  }

  // Execute branch deductions & create ledger entries
  for (const [, plan] of stockDeductionPlan) {
    const { itemDoc, totalQtyToDeduct } = plan;

    // Re-fetch item within session to lock the row
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
    const newStock = Math.max(0, previousStock - totalQtyToDeduct); // or allow negative if configured

    branchStock.currentStock = newStock;
    await freshItem.save({ session });

    ledgerEntries.push({
      item: freshItem._id,
      branch: branchId,
      type: 'SALE_OUTWARD',
      quantityChanged: -totalQtyToDeduct,
      previousStock,
      newStock,
      unitCostAtTime: freshItem.costPerRecipeUnit || 0,
      totalMonetaryValue: totalQtyToDeduct * (freshItem.costPerRecipeUnit || 0),
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

      const returnQty = Number(ing.quantityRequired) * orderedQty;
      const previousStock = branchStock.currentStock;
      const newStock = previousStock + returnQty;

      branchStock.currentStock = newStock;
      await invItem.save({ session });

      const rollbackEntry = new StockTransaction({
        item: invItem._id,
        branch: branchId,
        type: 'SALE_RETURN',
        quantityChanged: returnQty,
        previousStock,
        newStock,
        unitCostAtTime: invItem.costPerRecipeUnit || 0,
        totalMonetaryValue: returnQty * (invItem.costPerRecipeUnit || 0),
        performedBy: userId,
        notes: `Order Cancelled Rollback: ${orderNumber}`,
      });

      await rollbackEntry.save({ session });
    }
  }
};

module.exports = {
  depleteInventoryForOrder,
  restoreInventoryForOrder,
};