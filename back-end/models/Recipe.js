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
      default: '',
    },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PRODUCT_RECIPE', 'SUB_RECIPE_PREP'],
      default: 'PRODUCT_RECIPE',
      required: true,
      index: true,
    },
    // If PRODUCT_RECIPE: linked menu product (e.g. "Beef Smash Burger")
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    // If SUB_RECIPE_PREP: custom name (e.g. "House Chipotle Sauce")
    name: {
      type: String,
      trim: true,
      default: '',
    },
    prepCategory: {
      type: String,
      enum: ['Sauces & Dressings', 'Marinades & Seasonings', 'Bakery & Dough', 'Sides & Extras', 'Other'],
      default: 'Sauces & Dressings',
    },
    // Batch output for sub-recipes (e.g. makes 2000 g of sauce)
    batchYieldQuantity: {
      type: Number,
      default: 1,
      min: [0.001, 'Yield must be greater than 0'],
    },
    yieldUnit: {
      type: String,
      enum: ['g', 'ml', 'piece', 'portion'],
      default: 'g',
    },
    // If sub-recipe creates an inventory item tracked in stock (e.g. Chipotle Sauce)
    outputInventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      default: null,
    },
    ingredients: [recipeIngredientSchema],
    preparationNotes: {
      type: String,
      trim: true,
      default: '',
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