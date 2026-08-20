// back-end/controllers/purchaseOrderController.js
const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

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
      .populate('supplier', 'name phone email paymentTerms')
      .populate('branch', 'name city branchCode')
      .populate({
        path: 'items.item',
        select: 'name sku purchaseUnit recipeUnit conversionFactor costPerPurchaseUnit',
      })
      .populate({
        path: 'createdBy',
        select: 'name email',
      })
      .populate({
        path: 'receivedBy',
        select: 'name email',
      })
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
      status: status || 'ORDERED',
      createdBy: req.user?._id || null,
    });

    const savedPO = await newPO.save();
    res.status(201).json(savedPO);
  } catch (error) {
    console.error('Error in createPurchaseOrder:', error);
    res.status(500).json({ message: 'Error creating purchase order', error: error.message });
  }
};

// @desc    Receive Stock Delivery (Executes ACID Transaction, Inward Ledger, & Updates WAC)
// @route   POST /api/purchase-orders/:id/receive
// @access  Private (purchase_orders:receive, inventory:adjust)
const receivePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { receivedItems, supplierInvoiceNo, notes } = req.body;

    const po = await PurchaseOrder.findById(id).session(session);
    if (!po) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Purchase order not found.' });
    }

    if (po.status === 'RECEIVED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'This purchase order has already been received.' });
    }

    const ledgerEntries = [];

    for (const recItem of receivedItems) {
      const poItemIndex = po.items.findIndex(
        (i) => i.item.toString() === recItem.itemId.toString()
      );

      if (poItemIndex === -1) continue;

      const receivedQty = Number(recItem.receivedQuantity) || 0;
      const actualUnitCost = Number(recItem.actualUnitPurchasePrice || po.items[poItemIndex].unitPurchasePrice);

      po.items[poItemIndex].receivedQuantity = receivedQty;
      po.items[poItemIndex].unitPurchasePrice = actualUnitCost;
      po.items[poItemIndex].subtotal = Number((receivedQty * actualUnitCost).toFixed(2));

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
      const incomingRecipeUnits = receivedQty * factor;
      const incomingRecipeUnitCost = Number((actualUnitCost / factor).toFixed(4));

      // Weighted Average Cost (WAC)
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
        notes: `PO Received: ${po.poNumber} (Invoice: ${supplierInvoiceNo || 'N/A'})`,
      });
    }

    if (ledgerEntries.length > 0) {
      await StockTransaction.insertMany(ledgerEntries, { session });
    }

    po.status = 'RECEIVED';
    po.receivedAt = new Date();
    po.receivedBy = req.user?._id || null;
    po.supplierInvoiceNo = supplierInvoiceNo || '';
    if (notes) po.notes = notes;
    po.totalAmount = po.items.reduce((sum, itm) => sum + itm.subtotal, 0);

    await po.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Stock received and WAC calculated successfully.' });
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
  receivePurchaseOrder,
};