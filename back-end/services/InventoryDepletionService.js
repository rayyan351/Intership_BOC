// back-end/services/inventoryDepletionService.js
const Recipe = require('../models/Recipe');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const StockBatch = require('../models/StockBatch');

/**
 * Pre-validates if branch has sufficient raw ingredients before committing the order.
 * Takes cooking yield/shrinkage loss factors and item customizations into account.
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

    if (!recipe) continue;

    // 1. Accumulate Base Recipe Ingredients
    if (recipe.ingredients) {
      for (const ing of recipe.ingredients) {
        const item = ing.inventoryItem;
        if (!item) continue;

        const itemIdStr = item._id.toString();
        const yieldFactor = (Number(ing.yieldPercentage) || 100) / 100;
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

    // 2. Accumulate Customization / Add-on Ingredients (if sent from cart)
    const customizations = lineItem.customizations || [];
    if (Array.isArray(customizations) && customizations.length > 0 && recipe.customizationRules) {
      for (const mod of customizations) {
        const modName = (typeof mod === 'string' ? mod : mod.name || '').trim().toLowerCase();
        const rule = recipe.customizationRules?.find(
          (r) => r.optionName?.trim().toLowerCase() === modName
        );

        if (rule && rule.additionalIngredients) {
          for (const addIng of rule.additionalIngredients) {
            if (!addIng.inventoryItem) continue;
            const addInvItem = addIng.inventoryItem;
            const itemIdStr = addInvItem._id?.toString() || addInvItem.toString();
            const yieldFactor = (Number(addIng.yieldPercentage) || 100) / 100;
            const grossNeeded = (Number(addIng.quantityRequired) / yieldFactor) * qty;

            if (requirements.has(itemIdStr)) {
              requirements.get(itemIdStr).requiredQty += grossNeeded;
            } else {
              requirements.set(itemIdStr, {
                id: addInvItem._id || addInvItem,
                name: addInvItem.name || 'Custom Add-on Ingredient',
                unit: addInvItem.recipeUnit || 'g',
                requiredQty: grossNeeded,
              });
            }
          }
        }
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
 * Prioritizes oldest/nearest-expiry stock using First-Expired, First-Out (FEFO).
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
      .populate('customizationRules.additionalIngredients.inventoryItem')
      .session(session);

    if (!recipe) continue;

    // Collect base ingredients + customizations into raw requirements array
    const rawReqs = [];

    if (recipe.ingredients) {
      for (const ing of recipe.ingredients) {
        if (!ing.inventoryItem) continue;
        const yieldFactor = (Number(ing.yieldPercentage) || 100) / 100;
        const grossNeeded = (Number(ing.quantityRequired) / yieldFactor) * orderedQty;
        rawReqs.push({ item: ing.inventoryItem, qty: grossNeeded });
      }
    }

    const customizations = lineItem.customizations || [];
    if (Array.isArray(customizations) && customizations.length > 0 && recipe.customizationRules) {
      for (const mod of customizations) {
        const modName = (typeof mod === 'string' ? mod : mod.name || '').trim().toLowerCase();
        const rule = recipe.customizationRules.find(
          (r) => r.optionName?.trim().toLowerCase() === modName
        );

        if (rule && rule.additionalIngredients) {
          for (const addIng of rule.additionalIngredients) {
            if (!addIng.inventoryItem) continue;
            const yieldFactor = (Number(addIng.yieldPercentage) || 100) / 100;
            const grossNeeded = (Number(addIng.quantityRequired) / yieldFactor) * orderedQty;
            rawReqs.push({ item: addIng.inventoryItem, qty: grossNeeded });
          }
        }
      }
    }

    for (const req of rawReqs) {
      const invItem = req.item;
      const itemIdStr = invItem._id.toString();

      if (stockDeductionPlan.has(itemIdStr)) {
        stockDeductionPlan.get(itemIdStr).totalQtyToDeduct += req.qty;
      } else {
        stockDeductionPlan.set(itemIdStr, {
          itemDoc: invItem,
          totalQtyToDeduct: req.qty,
        });
      }
    }
  }

  // 2. Execute branch deductions, FEFO batch consumption, & build ledger records
  for (const [, plan] of stockDeductionPlan) {
    const { itemDoc, totalQtyToDeduct } = plan;
    const roundedDeduction = Number(totalQtyToDeduct.toFixed(2));

    const freshItem = await InventoryItem.findById(itemDoc._id || itemDoc).session(session);
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

    // 3. FEFO Batch Depletion: Deduct from active batches nearest to expiration
    let qtyRemainingToDeduct = roundedDeduction;

    const activeBatches = await StockBatch.find({
      item: freshItem._id,
      branch: branchId,
      status: 'ACTIVE',
      remainingQuantity: { $gt: 0 },
    })
      .sort({ expiryDate: 1 }) // FEFO ordering
      .session(session);

    for (const batch of activeBatches) {
      if (qtyRemainingToDeduct <= 0) break;

      if (batch.remainingQuantity <= qtyRemainingToDeduct) {
        qtyRemainingToDeduct = Number((qtyRemainingToDeduct - batch.remainingQuantity).toFixed(2));
        batch.remainingQuantity = 0;
        batch.status = 'DEPLETED';
      } else {
        batch.remainingQuantity = Number((batch.remainingQuantity - qtyRemainingToDeduct).toFixed(2));
        qtyRemainingToDeduct = 0;
      }
      await batch.save({ session });
    }

    // 4. Log double-entry ledger entry
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

    const recipe = await Recipe.findOne({ product: productId })
      .populate('ingredients.inventoryItem')
      .session(session);

    if (!recipe) continue;

    const rawReqs = [];
    if (recipe.ingredients) {
      for (const ing of recipe.ingredients) {
        if (!ing.inventoryItem) continue;
        const yieldFactor = (Number(ing.yieldPercentage) || 100) / 100;
        const grossNeeded = (Number(ing.quantityRequired) / yieldFactor) * orderedQty;
        rawReqs.push({ item: ing.inventoryItem, qty: grossNeeded });
      }
    }

    for (const req of rawReqs) {
      const invItem = await InventoryItem.findById(req.item._id || req.item).session(session);
      if (!invItem) continue;

      const branchStock = invItem.branchStocks.find(
        (bs) => bs.branch.toString() === branchId.toString()
      );
      if (!branchStock) continue;

      const returnQty = Number(req.qty.toFixed(2));
      const previousStock = branchStock.currentStock;
      const newStock = Number((previousStock + returnQty).toFixed(2));

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
        totalMonetaryValue: Number((returnQty * (invItem.costPerRecipeUnit || 0)).toFixed(2)),
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