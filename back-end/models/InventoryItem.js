// back-end/models/InventoryItem.js
const mongoose = require('mongoose');

const branchStockSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    currentStock: {
      type: Number, // Measured strictly in recipeUnit (e.g. grams, ml, pieces)
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number, // Minimum safety threshold before trigger alert
      default: 500, // e.g. 500g or 20 pcs
    },
    idealStock: {
      type: Number,
      default: 5000,
    },
  },
  { _id: false }
);

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU / Inventory Code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Meat', 'Dairy', 'Bakery', 'Produce', 'Sauces & Condiments', 'Packaging', 'Beverages', 'Other'],
      default: 'Other',
    },
    // Purchasing Unit vs Kitchen Recipe Unit
    purchaseUnit: {
      type: String,
      required: true, // e.g., 'kg', 'liter', 'carton_24', 'box_100'
      enum: ['kg', 'liter', 'piece', 'box', 'carton', 'pack', 'tray'],
    },
    recipeUnit: {
      type: String,
      required: true, // e.g., 'g', 'ml', 'piece'
      enum: ['g', 'ml', 'piece'],
    },
    conversionFactor: {
      type: Number,
      required: true, // 1 kg = 1000 g -> conversionFactor = 1000
      default: 1000,
    },
    // Cost Tracking
    costPerPurchaseUnit: {
      type: Number,
      required: true,
      min: 0, // e.g., Rs. 2,200 / kg
    },
    costPerRecipeUnit: {
      type: Number,
      required: true,
      min: 0, // Computed as: costPerPurchaseUnit / conversionFactor (Rs. 2.20 / gram)
    },
    primarySupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    // Multi-Branch Stock Ledger
    branchStocks: [branchStockSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-compute costPerRecipeUnit prior to saving
// ✅ Modern Mongoose hook (no next parameter needed)
inventoryItemSchema.pre('save', function () {
  if (this.conversionFactor && this.costPerPurchaseUnit !== undefined) {
    this.costPerRecipeUnit = Number((this.costPerPurchaseUnit / this.conversionFactor).toFixed(4));
  }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);