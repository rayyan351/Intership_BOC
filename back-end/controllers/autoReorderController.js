// back-end/controllers/autoReorderController.js
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');

// @desc    Get low-stock replenishment suggestions grouped by supplier
// @route   GET /api/inventory/auto-reorder/suggestions
// @access  Private (inventory:view, purchase_orders:view)
const getReorderSuggestions = async (req, res) => {
  try {
    const { branchId } = req.query;

    const items = await InventoryItem.find({ isActive: { $ne: false } })
      .populate('primarySupplier', 'name email phone paymentTerms address')
      .populate('branchStocks.branch', 'name city branchCode')
      .lean();

    const lowStockMap = new Map(); // Key: supplierId -> { supplier, branch, items, estimatedTotal }

    for (const item of items) {
      if (!item.branchStocks || !item.branchStocks.length) continue;

      for (const bs of item.branchStocks) {
        if (!bs.branch) continue;

        // Optional filter by branch
        if (branchId && bs.branch._id.toString() !== branchId.toString()) {
          continue;
        }

        const currentStock = bs.currentStock || 0;
        const reorderLevel = bs.reorderLevel || 500;
        const idealStock = bs.idealStock || Math.max(reorderLevel * 3, 2000);

        if (currentStock <= reorderLevel) {
          const supplier = item.primarySupplier || {
            _id: 'unassigned',
            name: 'Unassigned / General Vendor',
            paymentTerms: 'Net 30',
          };

          const supplierKey = `${supplier._id}_${bs.branch._id}`;

          // Calculate deficit in recipe units & convert to purchase units
          const deficitRecipeUnits = Math.max(0, idealStock - currentStock);
          const conversionFactor = item.conversionFactor || 1;
          
          // Order quantity in whole purchase units (e.g. 5 cartons or 20 kg)
          const suggestedPurchaseUnits = Math.max(
            1,
            Math.ceil(deficitRecipeUnits / conversionFactor)
          );

          const unitPrice = Number(item.costPerPurchaseUnit || 0);
          const estimatedLineCost = Number((suggestedPurchaseUnits * unitPrice).toFixed(2));

          if (!lowStockMap.has(supplierKey)) {
            lowStockMap.set(supplierKey, {
              supplierId: supplier._id,
              supplierName: supplier.name,
              supplierPhone: supplier.phone || '',
              supplierTerms: supplier.paymentTerms || 'Net 30',
              branchId: bs.branch._id,
              branchName: bs.branch.name,
              branchCity: bs.branch.city,
              items: [],
              estimatedTotalValuation: 0,
            });
          }

          const group = lowStockMap.get(supplierKey);
          group.items.push({
            itemId: item._id,
            name: item.name,
            sku: item.sku,
            currentStock,
            reorderLevel,
            idealStock,
            recipeUnit: item.recipeUnit,
            purchaseUnit: item.purchaseUnit,
            conversionFactor,
            suggestedPurchaseUnits,
            costPerPurchaseUnit: unitPrice,
            estimatedLineCost,
            urgency: currentStock <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          });

          group.estimatedTotalValuation = Number(
            (group.estimatedTotalValuation + estimatedLineCost).toFixed(2)
          );
        }
      }
    }

    const suggestions = Array.from(lowStockMap.values());
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error);
    res.status(500).json({ message: 'Failed to generate reorder suggestions', error: error.message });
  }
};

// @desc    Generate 1-Click Draft Purchase Order from suggestions
// @route   POST /api/inventory/auto-reorder/generate-po
// @access  Private (purchase_orders:create)
const generateAutoReorderPO = async (req, res) => {
  try {
    const { supplierId, branchId, items, paymentTerms, notes } = req.body;

    if (!supplierId || supplierId === 'unassigned') {
      return res.status(400).json({ message: 'A valid registered supplier is required to generate a PO.' });
    }

    if (!branchId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Destination branch and at least one item are required.' });
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-AUTO-${todayStr}-${randomSuffix}`;

    let totalAmount = 0;
    const formattedItems = items.map((itm) => {
      const qty = Number(itm.orderedQuantity || itm.suggestedPurchaseUnits) || 1;
      const price = Number(itm.unitPurchasePrice || itm.costPerPurchaseUnit) || 0;
      const subtotal = Number((qty * price).toFixed(2));
      totalAmount += subtotal;

      return {
        item: itm.itemId || itm.item,
        orderedQuantity: qty,
        receivedQuantity: 0,
        unitPurchasePrice: price,
        subtotal,
      };
    });

    const newPO = new PurchaseOrder({
      poNumber,
      supplier: supplierId,
      branch: branchId,
      items: formattedItems,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: 'DRAFT',
      notes: notes || 'Auto-generated replenishment order based on minimum stock threshold calculation.',
      createdBy: req.user?._id || null,
    });

    const savedPO = await newPO.save();

    res.status(201).json({
      message: `Draft Purchase Order ${poNumber} created successfully!`,
      po: savedPO,
    });
  } catch (error) {
    console.error('Error creating auto-reorder PO:', error);
    res.status(500).json({ message: 'Failed to create auto-reorder PO', error: error.message });
  }
};

module.exports = {
  getReorderSuggestions,
  generateAutoReorderPO,
};