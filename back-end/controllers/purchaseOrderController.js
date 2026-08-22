// back-end/controllers/purchaseOrderController.js
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const StockBatch = require('../models/StockBatch');

/**
 * Category-aware perishable shelf-life estimation helper (in days).
 * Used when no explicit expiry date is provided on the supplier invoice.
 */
const getCategoryDefaultShelfDays = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('bun') || cat.includes('bakery') || cat.includes('bread')) return 3;
  if (cat.includes('meat') || cat.includes('beef') || cat.includes('chicken') || cat.includes('patty')) return 4;
  if (cat.includes('dairy') || cat.includes('cheese') || cat.includes('milk')) return 10;
  if (cat.includes('sauce') || cat.includes('produce') || cat.includes('veg') || cat.includes('vegetable')) return 7;
  if (cat.includes('oil') || cat.includes('fryer')) return 30;
  if (cat.includes('frozen')) return 90;
  if (cat.includes('packaging') || cat.includes('box') || cat.includes('wrap')) return 365;
  return 30; // Standard fallback
};

// @desc    Get all Purchase Orders
// @route   GET /api/purchase-orders
// @access  Private (purchase_orders:view, inventory:view)
const getPurchaseOrders = async (req, res) => {
  try {
    const { branchId, status, supplierId } = req.query;
    const filter = {};

    if (branchId) filter.branch = branchId;
    if (status) filter.status = status;
    if (supplierId) filter.supplier = supplierId;

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name phone email paymentTerms address')
      .populate('branch', 'name city branchCode address phone')
      .populate({
        path: 'items.item',
        select: 'name sku purchaseUnit recipeUnit conversionFactor costPerPurchaseUnit costPerRecipeUnit category',
      })
      .populate('createdBy', 'name email')
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(orders || []);
  } catch (error) {
    console.error('Error in getPurchaseOrders:', error);
    res.status(500).json({ message: 'Error fetching purchase orders', error: error.message });
  }
};

// @desc    Create new Purchase Order (DRAFT or ORDERED)
// @route   POST /api/purchase-orders
// @access  Private (purchase_orders:create)
const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, branch, items, expectedDeliveryDate, notes, status } = req.body;

    if (!supplier || !branch) {
      return res.status(400).json({ message: 'Supplier and branch are required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Purchase order must contain at least one item.' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${dateStr}-${randomSuffix}`;

    let totalAmount = 0;
    const formattedItems = items.map((itm) => {
      const qty = Number(itm.orderedQuantity) || 1;
      const price = Number(itm.unitPurchasePrice) || 0;
      const subtotal = Number((qty * price).toFixed(2));
      totalAmount += subtotal;

      return {
        item: itm.item,
        orderedQuantity: qty,
        receivedQuantity: 0,
        unitPurchasePrice: price,
        subtotal,
      };
    });

    const newPO = new PurchaseOrder({
      poNumber,
      supplier,
      branch,
      items: formattedItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      expectedDeliveryDate: expectedDeliveryDate || null,
      notes: notes || '',
      status: status || 'DRAFT',
      createdBy: req.user?._id || null,
    });

    const savedPO = await newPO.save();
    res.status(201).json(savedPO);
  } catch (error) {
    console.error('Error in createPurchaseOrder:', error);
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  }
};

// @desc    Update Purchase Order Status (e.g. DRAFT -> ORDERED or CANCELLED)
// @route   PUT /api/purchase-orders/:id/status
// @access  Private (purchase_orders:edit)
const updatePOStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found.' });
    }

    if (po.status === 'RECEIVED') {
      return res.status(400).json({ message: 'Received purchase orders cannot change status.' });
    }

    po.status = status;
    await po.save();

    res.status(200).json(po);
  } catch (error) {
    console.error('Error in updatePOStatus:', error);
    res.status(500).json({ message: 'Error updating PO status', error: error.message });
  }
};

// @desc    Receive Stock Delivery (Executes ACID Transaction, Inward Ledger, WAC, and Category-Aware FEFO Batch Creation)
// @route   POST /api/purchase-orders/:id/receive
// @access  Private (purchase_orders:receive, inventory:adjust)
const receivePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { receivedItems, supplierInvoiceNo, notes } = req.body;

    if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No received delivery items provided.' });
    }

    const po = await PurchaseOrder.findById(id).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Purchase order not found.' });
    }

    if (po.status === 'RECEIVED' || po.status === 'CANCELLED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Cannot receive stock on a ${po.status} purchase order.` });
    }

    const ledgerEntries = [];
    const batchEntries = [];

    for (const recItem of receivedItems) {
      const poItemIndex = po.items.findIndex(
        (i) => i.item.toString() === recItem.itemId.toString()
      );

      if (poItemIndex === -1) continue;

      const incomingQty = Number(recItem.receivedQuantity) || 0;
      if (incomingQty <= 0) continue;

      const actualUnitCost = Number(
        recItem.actualUnitPurchasePrice !== undefined && recItem.actualUnitPurchasePrice !== null
          ? recItem.actualUnitPurchasePrice
          : po.items[poItemIndex].unitPurchasePrice
      );

      // Accumulate existing received quantity with new delivery batch
      const currentReceivedQty = po.items[poItemIndex].receivedQuantity || 0;
      const newTotalReceivedQty = currentReceivedQty + incomingQty;

      po.items[poItemIndex].receivedQuantity = newTotalReceivedQty;
      po.items[poItemIndex].unitPurchasePrice = actualUnitCost;
      po.items[poItemIndex].subtotal = Number((newTotalReceivedQty * actualUnitCost).toFixed(2));

      const invItem = await InventoryItem.findById(recItem.itemId).session(session);
      if (!invItem) continue;

      let branchStock = invItem.branchStocks.find(
        (bs) => bs.branch.toString() === po.branch.toString()
      );

      if (!branchStock) {
        invItem.branchStocks.push({
          branch: po.branch,
          currentStock: 0,
          reorderLevel: 500,
          idealStock: 5000,
        });
        branchStock = invItem.branchStocks[invItem.branchStocks.length - 1];
      }

      const factor = invItem.conversionFactor || 1;
      const incomingRecipeUnits = incomingQty * factor;
      const incomingRecipeUnitCost = Number((actualUnitCost / factor).toFixed(4));

      // Weighted Average Cost (WAC) Formulation
      const currentRecipeUnits = branchStock.currentStock || 0;
      const currentRecipeUnitCost = invItem.costPerRecipeUnit || 0;

      const currentTotalVal = currentRecipeUnits * currentRecipeUnitCost;
      const incomingTotalVal = incomingRecipeUnits * incomingRecipeUnitCost;
      const combinedUnits = currentRecipeUnits + incomingRecipeUnits;

      let newRecipeCost = currentRecipeUnitCost;
      if (combinedUnits > 0) {
        newRecipeCost = Number(((currentTotalVal + incomingTotalVal) / combinedUnits).toFixed(4));
      }

      invItem.costPerRecipeUnit = newRecipeCost;
      invItem.costPerPurchaseUnit = Number((newRecipeCost * factor).toFixed(2));
      branchStock.currentStock = currentRecipeUnits + incomingRecipeUnits;

      await invItem.save({ session });

      // Create Double-Entry Inward Transaction
      ledgerEntries.push({
        item: invItem._id,
        branch: po.branch,
        type: 'PURCHASE_INWARD',
        quantityChanged: incomingRecipeUnits,
        previousStock: currentRecipeUnits,
        newStock: branchStock.currentStock,
        unitCostAtTime: newRecipeCost,
        totalMonetaryValue: incomingTotalVal,
        performedBy: req.user?._id || po.createdBy,
        notes: `PO Received (${po.poNumber}): Invoice #${supplierInvoiceNo || 'N/A'}${notes ? ` - ${notes}` : ''}`,
      });

      // Generate Category-Aware FEFO StockBatch for this delivery lot
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedBatchNo = `LOT-${invItem.sku || 'RAW'}-${dateCode}-${uniqueSuffix}`;

      // Dynamic Category-Based Expiry Calculation
      const defaultShelfDays = getCategoryDefaultShelfDays(invItem.category);
      const computedDefaultExpiry = new Date(Date.now() + defaultShelfDays * 24 * 60 * 60 * 1000);

      const batchExpiryDate = recItem.expiryDate
        ? new Date(recItem.expiryDate)
        : computedDefaultExpiry;

      batchEntries.push({
        batchNumber: recItem.batchNumber || generatedBatchNo,
        item: invItem._id,
        branch: po.branch,
        purchaseOrder: po._id,
        initialQuantity: incomingRecipeUnits,
        remainingQuantity: incomingRecipeUnits,
        unitCost: newRecipeCost,
        expiryDate: batchExpiryDate,
        receivedDate: new Date(),
        status: 'ACTIVE',
      });
    }

    if (ledgerEntries.length > 0) {
      await StockTransaction.insertMany(ledgerEntries, { session });
    }

    if (batchEntries.length > 0) {
      await StockBatch.insertMany(batchEntries, { session });
    }

    // Check completion status across all ordered lines
    const isAllFullyReceived = po.items.every(
      (itm) => (itm.receivedQuantity || 0) >= itm.orderedQuantity
    );

    po.status = isAllFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    po.receivedAt = new Date();
    po.receivedBy = req.user?._id || null;
    po.supplierInvoiceNo = supplierInvoiceNo || po.supplierInvoiceNo || '';
    if (notes) po.notes = notes;
    po.totalAmount = po.items.reduce((sum, itm) => sum + itm.subtotal, 0);

    po.markModified('items');
    await po.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Stock received, WAC calculated, audit ledger updated, and category-aware FEFO batches created successfully.',
      po,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error receiving PO:', error);
    res.status(500).json({ message: 'Failed to receive purchase order', error: error.message });
  }
};

module.exports = {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePOStatus,
  receivePurchaseOrder,
};