// back-end/controllers/batchController.js
const mongoose = require('mongoose');
const StockBatch = require('../models/StockBatch');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get all active/expiring inventory batches sorted by FEFO (nearest expiry first)
// @route   GET /api/inventory/batches
// @access  Private (inventory:view)
const getStockBatches = async (req, res) => {
  try {
    const { branchId, itemId, status } = req.query;
    const filter = {};

    if (branchId) filter.branch = branchId;
    if (itemId) filter.item = itemId;
    if (status) filter.status = status;

    const batches = await StockBatch.find(filter)
      .populate('item', 'name sku recipeUnit purchaseUnit costPerRecipeUnit category')
      .populate('branch', 'name city')
      .populate('purchaseOrder', 'poNumber supplier')
      .sort({ expiryDate: 1 }); // FEFO ordering

    const now = new Date();
    const evaluatedBatches = batches.map((batch) => {
      const bObj = batch.toObject();
      const expDate = new Date(bObj.expiryDate);
      const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

      let freshnessAlert = 'GOOD'; // > 7 days
      if (bObj.remainingQuantity <= 0) {
        freshnessAlert = 'DEPLETED';
      } else if (diffDays < 0) {
        freshnessAlert = 'EXPIRED';
      } else if (diffDays <= 3) {
        freshnessAlert = 'CRITICAL'; // Expiring in <= 3 days
      } else if (diffDays <= 7) {
        freshnessAlert = 'WARNING'; // Expiring in <= 7 days
      }

      return {
        ...bObj,
        daysUntilExpiry: diffDays,
        freshnessAlert,
        holdingMonetaryValue: Number((bObj.remainingQuantity * bObj.unitCost).toFixed(2)),
      };
    });

    res.status(200).json(evaluatedBatches);
  } catch (error) {
    console.error('Error fetching stock batches:', error);
    res.status(500).json({ message: 'Failed to fetch batch inventory', error: error.message });
  }
};

// @desc    Discard / Write-Off Expired Batch with Double-Entry Ledger logging
// @route   POST /api/inventory/batches/:id/discard
// @access  Private (inventory:adjust)
const discardExpiredBatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const batch = await StockBatch.findById(id).session(session);
    if (!batch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Stock batch not found.' });
    }

    if (batch.remainingQuantity <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'This batch has zero remaining stock.' });
    }

    const discardedQty = batch.remainingQuantity;
    const totalLossVal = Number((discardedQty * batch.unitCost).toFixed(2));

    // Update master item branch stock
    const itemDoc = await InventoryItem.findById(batch.item).session(session);
    if (itemDoc) {
      const branchStock = itemDoc.branchStocks.find(
        (bs) => bs.branch.toString() === batch.branch.toString()
      );
      if (branchStock) {
        const prevStock = branchStock.currentStock;
        branchStock.currentStock = Math.max(0, Number((prevStock - discardedQty).toFixed(2)));
        await itemDoc.save({ session });

        // Record Expiry Waste Outward in Ledger
        const ledgerEntry = new StockTransaction({
          item: itemDoc._id,
          branch: batch.branch,
          type: 'WASTE_OUTWARD',
          quantityChanged: -discardedQty,
          previousStock: prevStock,
          newStock: branchStock.currentStock,
          unitCostAtTime: batch.unitCost,
          totalMonetaryValue: totalLossVal,
          performedBy: req.user?._id || null,
          notes: `Batch Discarded (${batch.batchNumber}): ${reason || 'Expired perishable goods write-off'}${notes ? ` - ${notes}` : ''}`,
        });
        await ledgerEntry.save({ session });
      }
    }

    batch.remainingQuantity = 0;
    batch.status = 'DISCARDED';
    if (notes) batch.notes = `${batch.notes ? `${batch.notes} | ` : ''}Discarded: ${notes}`;
    await batch.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Batch ${batch.batchNumber} discarded and written off to waste ledger.`,
      batch,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error discarding batch:', error);
    res.status(500).json({ message: 'Failed to discard batch', error: error.message });
  }
};

module.exports = {
  getStockBatches,
  discardExpiredBatch,
};  