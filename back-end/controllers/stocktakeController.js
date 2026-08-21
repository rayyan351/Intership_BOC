// back-end/controllers/stocktakeController.js
const mongoose = require('mongoose');
const Stocktake = require('../models/StockTake');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get all stocktake records with branch filters
// @route   GET /api/inventory/stocktakes
// @access  Private (inventory:view, stocktake:view)
const getStocktakes = async (req, res) => {
  try {
    const { branchId } = req.query;
    const filter = {};
    if (branchId) filter.branch = branchId;

    const stocktakes = await Stocktake.find(filter)
      .populate('branch', 'name city branchCode')
      .populate('items.item', 'name sku recipeUnit purchaseUnit costPerRecipeUnit')
      .populate('conductedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(stocktakes || []);
  } catch (error) {
    console.error('Error fetching stocktakes:', error);
    res.status(500).json({ message: 'Failed to fetch stocktake history', error: error.message });
  }
};

// @desc    Submit & Reconcile Physical Stocktake in a single transaction
// @route   POST /api/inventory/stocktakes
// @access  Private (inventory:adjust, stocktake:create)
const submitStocktakeReconciliation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { branch, auditNotes, counts } = req.body; 
    // counts: Array of { itemId, physicalCount, discrepancyReason }

    if (!branch || !Array.isArray(counts) || counts.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Branch and counted inventory items are required.' });
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const stocktakeNumber = `ST-${todayStr}-${randomSuffix}`;

    const reconciledLineItems = [];
    const ledgerEntries = [];

    let totalVarianceQuantity = 0;
    let totalShrinkageLoss = 0;
    let totalNetVarianceValue = 0;

    for (const entry of counts) {
      const { itemId, physicalCount, discrepancyReason } = entry;
      const countVal = Number(physicalCount);

      if (isNaN(countVal) || countVal < 0) continue;

      const itemDoc = await InventoryItem.findById(itemId).session(session);
      if (!itemDoc) continue;

      let branchStock = itemDoc.branchStocks.find(
        (bs) => bs.branch.toString() === branch.toString()
      );

      if (!branchStock) {
        itemDoc.branchStocks.push({
          branch,
          currentStock: 0,
          reorderLevel: 500,
          idealStock: 5000,
        });
        branchStock = itemDoc.branchStocks[itemDoc.branchStocks.length - 1];
      }

      const theoreticalStock = branchStock.currentStock || 0;
      const variance = Number((countVal - theoreticalStock).toFixed(2));
      const unitCost = Number(itemDoc.costPerRecipeUnit || 0);
      const varianceVal = Number((variance * unitCost).toFixed(2));

      totalVarianceQuantity += variance;
      totalNetVarianceValue += varianceVal;
      if (variance < 0) {
        totalShrinkageLoss += Math.abs(varianceVal);
      }

      // Update branch current balance to exact physical count
      branchStock.currentStock = countVal;
      await itemDoc.save({ session });

      reconciledLineItems.push({
        item: itemDoc._id,
        systemStock: theoreticalStock,
        physicalCount: countVal,
        varianceQuantity: variance,
        unitCost,
        varianceValue: varianceVal,
        discrepancyReason: discrepancyReason || 'Physical Audit Variance',
      });

      // If variance exists, log immutable Double-Entry adjustment in Ledger
      if (variance !== 0) {
        ledgerEntries.push({
          item: itemDoc._id,
          branch,
          type: 'PHYSICAL_AUDIT_ADJUSTMENT',
          quantityChanged: variance,
          previousStock: theoreticalStock,
          newStock: countVal,
          unitCostAtTime: unitCost,
          totalMonetaryValue: Math.abs(varianceVal),
          performedBy: req.user?._id || null,
          notes: `Stocktake Reconciliation (${stocktakeNumber}): ${discrepancyReason || 'Physical Audit Adjustment'}`,
        });
      }
    }

    if (ledgerEntries.length > 0) {
      await StockTransaction.insertMany(ledgerEntries, { session });
    }

    const stocktakeRecord = new Stocktake({
      stocktakeNumber,
      branch,
      status: 'RECONCILED',
      items: reconciledLineItems,
      totalVarianceQuantity: Number(totalVarianceQuantity.toFixed(2)),
      totalShrinkageLoss: Number(totalShrinkageLoss.toFixed(2)),
      totalNetVarianceValue: Number(totalNetVarianceValue.toFixed(2)),
      auditNotes: auditNotes || '',
      conductedBy: req.user?._id || null,
      reconciledAt: new Date(),
    });

    const savedStocktake = await stocktakeRecord.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Physical stocktake reconciled, inventory adjusted, and ledger updated successfully.',
      stocktake: savedStocktake,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Stocktake reconciliation error:', error);
    res.status(500).json({ message: 'Failed to reconcile stocktake', error: error.message });
  }
};

module.exports = {
  getStocktakes,
  submitStocktakeReconciliation,
};