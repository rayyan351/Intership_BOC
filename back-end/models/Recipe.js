// back-end/models/Recipe.js
const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Raw ingredient selection is required'],
    },
    quantityRequired: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.001, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      required: true, // Auto-synced with inventoryItem.recipeUnit (g, ml, piece)
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true, // One BOM recipe per menu product
    },
    ingredients: [recipeIngredientSchema],
    preparationNotes: {
      type: String,
      trim: true,
    },
    assemblyTimeMinutes: {
      type: Number,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);