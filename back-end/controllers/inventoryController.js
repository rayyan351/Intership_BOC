// back-end/controllers/inventoryController.js
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const Branch = require('../models/Branch');

// @desc    Get all inventory items with branch stock details
// @route   GET /api/inventory
// @access  Private (inventory:view)
const getInventoryItems = async (req, res) => {
  try {
    const { category, branchId, lowStockOnly } = req.query;
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    let items = await InventoryItem.find(filter)
      .populate('primarySupplier', 'name phone email paymentTerms')
      .populate('branchStocks.branch', 'name city branchCode')
      .sort({ name: 1 });

    // Filter by branch or low stock if requested
    if (branchId) {
      items = items.map((item) => {
        const itemObj = item.toObject();
        itemObj.branchStocks = itemObj.branchStocks.filter(
          (bs) => bs.branch?._id?.toString() === branchId || bs.branch?.toString() === branchId
        );
        return itemObj;
      });
    }

    if (lowStockOnly === 'true') {
      items = items.filter((item) =>
        item.branchStocks.some((bs) => bs.currentStock <= bs.reorderLevel)
      );
    }

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
};

// @desc    Create new inventory item (initializes stock across all active branches)
// @route   POST /api/inventory
// @access  Private (inventory:create)
const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchaseUnit,
      recipeUnit,
      conversionFactor,
      costPerPurchaseUnit,
      primarySupplier,
      initialStocks,
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ message: 'Name and SKU are required fields.' });
    }

    const cleanSku = sku.trim().toUpperCase();
    const existingSku = await InventoryItem.findOne({ sku: cleanSku });
    if (existingSku) {
      return res.status(400).json({ message: `Item with SKU "${cleanSku}" already exists.` });
    }

    // Safely retrieve branches
    let allBranches = [];
    try {
      allBranches = await Branch.find({});
    } catch (e) {
      console.warn('Branch collection lookup notice:', e.message);
    }

    const branchStocks = (allBranches || []).map((branch) => {
      const customConfig = initialStocks?.find(
        (s) => s.branchId?.toString() === branch._id.toString()
      );
      return {
        branch: branch._id,
        currentStock: Number(customConfig?.initialStock) || 0,
        reorderLevel: Number(customConfig?.reorderLevel) || 500,
        idealStock: Number(customConfig?.idealStock) || 5000,
      };
    });

    const parsedFactor = Number(conversionFactor) > 0 ? Number(conversionFactor) : 1;
    const parsedCost = Number(costPerPurchaseUnit) >= 0 ? Number(costPerPurchaseUnit) : 0;
    const computedRecipeCost = Number((parsedCost / parsedFactor).toFixed(4));

    // Handle primarySupplier cleanly (null if empty or unassigned)
    let validSupplierId = null;
    if (
      primarySupplier &&
      typeof primarySupplier === 'string' &&
      primarySupplier.trim() !== '' &&
      primarySupplier !== 'undefined'
    ) {
      validSupplierId = primarySupplier;
    }

    const newItem = new InventoryItem({
      name: name.trim(),
      sku: cleanSku,
      category: category || 'Other',
      purchaseUnit: purchaseUnit || 'kg',
      recipeUnit: recipeUnit || 'g',
      conversionFactor: parsedFactor,
      costPerPurchaseUnit: parsedCost,
      costPerRecipeUnit: computedRecipeCost,
      primarySupplier: validSupplierId,
      branchStocks,
    });

    const savedItem = await newItem.save();

    // Safely log opening transaction only if initial stock > 0 and user is authenticated
    if (req.user?._id && branchStocks.length > 0) {
      const transactionRecords = [];
      branchStocks.forEach((bs) => {
        if (bs.currentStock > 0) {
          transactionRecords.push({
            item: savedItem._id,
            branch: bs.branch,
            type: 'PURCHASE_INWARD',
            quantityChanged: bs.currentStock,
            previousStock: 0,
            newStock: bs.currentStock,
            unitCostAtTime: computedRecipeCost,
            totalMonetaryValue: bs.currentStock * computedRecipeCost,
            performedBy: req.user._id,
            notes: 'Initial opening stock allocation on item registration',
          });
        }
      });

      if (transactionRecords.length > 0) {
        try {
          await StockTransaction.insertMany(transactionRecords);
        } catch (txErr) {
          console.warn('Initial stock ledger warning (item still created):', txErr.message);
        }
      }
    }

    res.status(201).json(savedItem);
  } catch (error) {
    console.error('SERVER CRASH LOG [createInventoryItem]:', error);
    res.status(500).json({ message: error.message || 'Error creating inventory item' });
  }
};

// @desc    Update item metadata and pricing (Auto-recalculates recipe unit cost)
// @route   PUT /api/inventory/:id
// @access  Private (inventory:edit)
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      purchaseUnit,
      recipeUnit,
      conversionFactor,
      costPerPurchaseUnit,
      primarySupplier,
      branchStocks,
    } = req.body;

    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (name) item.name = name.trim();
    if (category) item.category = category;
    if (purchaseUnit) item.purchaseUnit = purchaseUnit;
    if (recipeUnit) item.recipeUnit = recipeUnit;

    if (primarySupplier !== undefined) {
      item.primarySupplier =
        primarySupplier && primarySupplier.toString().trim() !== ''
          ? primarySupplier
          : null;
    }

    if (conversionFactor) item.conversionFactor = Number(conversionFactor);
    if (costPerPurchaseUnit !== undefined) {
      item.costPerPurchaseUnit = Number(costPerPurchaseUnit);
      item.costPerRecipeUnit = Number((item.costPerPurchaseUnit / item.conversionFactor).toFixed(4));
    }

    if (Array.isArray(branchStocks)) {
      branchStocks.forEach((incoming) => {
        const existingStockIndex = item.branchStocks.findIndex(
          (bs) => bs.branch.toString() === incoming.branch?.toString()
        );
        if (existingStockIndex !== -1) {
          if (incoming.reorderLevel !== undefined) {
            item.branchStocks[existingStockIndex].reorderLevel = Number(incoming.reorderLevel);
          }
          if (incoming.idealStock !== undefined) {
            item.branchStocks[existingStockIndex].idealStock = Number(incoming.idealStock);
          }
        }
      });
    }

    const updatedItem = await item.save();
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

// @desc    Record an audited stock adjustment (Inward, Spoilage, Physical Audit)
// @route   POST /api/inventory/:id/adjust
// @access  Private (inventory:adjust)
const adjustStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { branchId, type, quantityChanged, notes } = req.body;

    if (!branchId || !type || quantityChanged === undefined) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Branch, adjustment type, and quantity are required.' });
    }

    const item = await InventoryItem.findById(id).session(session);
    if (!item) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    let branchStockEntry = item.branchStocks.find(
      (bs) => bs.branch.toString() === branchId.toString()
    );

    if (!branchStockEntry) {
      item.branchStocks.push({
        branch: branchId,
        currentStock: 0,
        reorderLevel: 500,
        idealStock: 5000,
      });
      branchStockEntry = item.branchStocks[item.branchStocks.length - 1];
    }

    const previousStock = branchStockEntry.currentStock;
    const delta = Number(quantityChanged);
    const newStock = previousStock + delta;

    if (newStock < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Adjustment causes negative stock. Current stock is ${previousStock} ${item.recipeUnit}.`,
      });
    }

    branchStockEntry.currentStock = newStock;
    await item.save({ session });

    const ledgerEntry = new StockTransaction({
      item: item._id,
      branch: branchId,
      type,
      quantityChanged: delta,
      previousStock,
      newStock,
      unitCostAtTime: item.costPerRecipeUnit,
      totalMonetaryValue: Math.abs(delta) * item.costPerRecipeUnit,
      performedBy: req.user._id,
      notes: notes || `Manual stock adjustment (${type})`,
    });

    await ledgerEntry.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Stock updated and audited successfully.',
      currentStock: newStock,
      recipeUnit: item.recipeUnit,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Stock adjustment transaction failed', error: error.message });
  }
};

// @desc    Get stock audit history/ledger for an item or branch
// @route   GET /api/inventory/ledger
// @access  Private (inventory:view)
const getStockLedger = async (req, res) => {
  try {
    const { itemId, branchId, type, limit = 50 } = req.query;
    const filter = {};

    if (itemId) filter.item = itemId;
    if (branchId) filter.branch = branchId;
    if (type) filter.type = type;

    const ledger = await StockTransaction.find(filter)
      .populate('item', 'name sku recipeUnit')
      .populate('branch', 'name city branchCode')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json(ledger);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock ledger', error: error.message });
  }
};

// @desc    Log Kitchen Wastage or Spoilage
// @route   POST /api/inventory/:id/spoilage
// @access  Private (inventory:adjust)
const logKitchenWastage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { branchId, wastedQuantity, reason, notes } = req.body;

    if (!branchId || !wastedQuantity || Number(wastedQuantity) <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Valid branch and wasted quantity are required.' });
    }

    const item = await InventoryItem.findById(id).session(session);
    if (!item) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    let branchStock = item.branchStocks.find(
      (bs) => bs.branch.toString() === branchId.toString()
    );

    if (!branchStock) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No stock record found for this branch.' });
    }

    const previousStock = branchStock.currentStock;
    const qtyToDeduct = Number(wastedQuantity);
    const newStock = Math.max(0, previousStock - qtyToDeduct);

    branchStock.currentStock = newStock;
    await item.save({ session });

    const totalLostValue = Number((qtyToDeduct * item.costPerRecipeUnit).toFixed(2));

    const ledgerEntry = new StockTransaction({
      item: item._id,
      branch: branchId,
      type: 'SPOILAGE_WASTE',
      quantityChanged: -qtyToDeduct,
      previousStock,
      newStock,
      unitCostAtTime: item.costPerRecipeUnit,
      totalMonetaryValue: totalLostValue,
      performedBy: req.user._id,
      notes: `Kitchen Wastage (${reason || 'Standard Spoilage'}): ${notes || 'No extra notes'}`,
    });

    await ledgerEntry.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Wastage recorded and written off successfully.',
      wastedValue: totalLostValue,
      remainingStock: newStock,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Failed to record wastage', error: error.message });
  }
};

// @desc    Get low stock alerts across all or selected branch
// @route   GET /api/inventory/alerts/low-stock
// @access  Private (inventory:view)
const getLowStockAlerts = async (req, res) => {
  try {
    const { branchId } = req.query;

    const filter = { isActive: true };
    const items = await InventoryItem.find(filter)
      .populate('branchStocks.branch', 'name city branchCode')
      .populate('primarySupplier', 'name phone email paymentTerms')
      .lean();

    const lowStockAlerts = [];

    items.forEach((item) => {
      (item.branchStocks || []).forEach((bs) => {
        if (branchId && bs.branch?._id?.toString() !== branchId) return;

        if (bs.currentStock <= bs.reorderLevel) {
          const deficit = Math.max(0, bs.reorderLevel - bs.currentStock);
          const requiredToIdeal = Math.max(0, bs.idealStock - bs.currentStock);
          const conversion = item.conversionFactor || 1;

          lowStockAlerts.push({
            itemId: item._id,
            name: item.name,
            sku: item.sku,
            category: item.category,
            recipeUnit: item.recipeUnit,
            purchaseUnit: item.purchaseUnit,
            conversionFactor: conversion,
            costPerPurchaseUnit: item.costPerPurchaseUnit,
            branch: bs.branch,
            currentStock: bs.currentStock,
            reorderLevel: bs.reorderLevel,
            idealStock: bs.idealStock,
            deficit,
            recommendedOrderPurchaseUnits: Math.ceil(requiredToIdeal / conversion),
            estimatedReorderCost: Number(
              (Math.ceil(requiredToIdeal / conversion) * (item.costPerPurchaseUnit || 0)).toFixed(2)
            ),
            supplier: item.primarySupplier,
          });
        }
      });
    });

    res.status(200).json(lowStockAlerts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch low stock alerts', error: error.message });
  }
};

// @desc    Transfer raw material between branch outlets
// @route   POST /api/inventory/transfer
// @access  Private (inventory:adjust)
const transferStockBetweenBranches = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { itemId, sourceBranchId, targetBranchId, quantity, notes } = req.body;

    if (!itemId || !sourceBranchId || !targetBranchId || !quantity || Number(quantity) <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Item, source, target branch, and valid quantity are required.' });
    }

    if (sourceBranchId.toString() === targetBranchId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Source and target branch cannot be the same.' });
    }

    const item = await InventoryItem.findById(itemId).session(session);
    if (!item) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    // 1. Validate Source Branch Stock
    let sourceStock = item.branchStocks.find((bs) => bs.branch.toString() === sourceBranchId.toString());
    const availableQty = sourceStock?.currentStock || 0;
    const transferQty = Number(quantity);

    if (availableQty < transferQty) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Insufficient stock at source branch. Available: ${availableQty} ${item.recipeUnit}`,
      });
    }

    // 2. Locate or initialize Target Branch Stock
    let targetStock = item.branchStocks.find((bs) => bs.branch.toString() === targetBranchId.toString());
    if (!targetStock) {
      item.branchStocks.push({
        branch: targetBranchId,
        currentStock: 0,
        reorderLevel: 500,
        idealStock: 5000,
      });
      targetStock = item.branchStocks[item.branchStocks.length - 1];
    }

    // 3. Update Balances
    const srcPrev = sourceStock.currentStock;
    const srcNew = srcPrev - transferQty;
    sourceStock.currentStock = srcNew;

    const tgtPrev = targetStock.currentStock;
    const tgtNew = tgtPrev + transferQty;
    targetStock.currentStock = tgtNew;

    await item.save({ session });

    // 4. Create Immutable Ledger Entries for both sides of transfer
    const monetaryVal = Number((transferQty * (item.costPerRecipeUnit || 0)).toFixed(2));

    const sourceLedger = new StockTransaction({
      item: item._id,
      branch: sourceBranchId,
      type: 'TRANSFER_OUT',
      quantityChanged: -transferQty,
      previousStock: srcPrev,
      newStock: srcNew,
      unitCostAtTime: item.costPerRecipeUnit || 0,
      totalMonetaryValue: monetaryVal,
      performedBy: req.user._id,
      notes: `Transfer OUT to target outlet. Notes: ${notes || 'Standard STO'}`,
    });

    const targetLedger = new StockTransaction({
      item: item._id,
      branch: targetBranchId,
      type: 'TRANSFER_IN',
      quantityChanged: transferQty,
      previousStock: tgtPrev,
      newStock: tgtNew,
      unitCostAtTime: item.costPerRecipeUnit || 0,
      totalMonetaryValue: monetaryVal,
      performedBy: req.user._id,
      notes: `Transfer IN from source outlet. Notes: ${notes || 'Standard STO'}`,
    });

    await StockTransaction.insertMany([sourceLedger, targetLedger], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Successfully transferred ${transferQty} ${item.recipeUnit} between branches.`,
      transferredQuantity: transferQty,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Branch transfer failed', error: error.message });
  }
};

module.exports = {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  getStockLedger,
  logKitchenWastage,
  getLowStockAlerts,
  transferStockBetweenBranches,
};