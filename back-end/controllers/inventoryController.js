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
// Replace createInventoryItem in back-end/controllers/inventoryController.js
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

// Add to back-end/controllers/inventoryController.js

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

// Export ALL 5 methods cleanly
module.exports = {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  getStockLedger,
  logKitchenWastage,
};