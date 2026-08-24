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
      type: Number, // Measured in recipeUnit (e.g. grams, ml, pieces)
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number, // Safety threshold for low stock alert
      default: 500,
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
    purchaseUnit: {
      type: String,
      required: true, // e.g. 'kg', 'liter', 'box'
      enum: ['kg', 'liter', 'piece', 'box', 'carton', 'pack', 'tray'],
    },
    recipeUnit: {
      type: String,
      required: true, // e.g. 'g', 'ml', 'piece'
      enum: ['g', 'ml', 'piece'],
    },
    conversionFactor: {
      type: Number,
      required: true, // e.g. 1 kg = 1000 g -> 1000
      default: 1000,
      min: [0.0001, 'Conversion factor must be greater than 0'],
    },
    costPerPurchaseUnit: {
      type: Number,
      required: true,
      min: 0, // e.g. Rs. 2,200 / kg
    },
    costPerRecipeUnit: {
      type: Number,
      required: true,
      min: 0, // Computed: costPerPurchaseUnit / conversionFactor (Rs. 2.20 / g)
    },
    primarySupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    branchStocks: [branchStockSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-compute costPerRecipeUnit prior to save
inventoryItemSchema.pre('save', function () {
  if (this.conversionFactor && this.costPerPurchaseUnit !== undefined) {
    this.costPerRecipeUnit = Number((this.costPerPurchaseUnit / this.conversionFactor).toFixed(4));
  }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);