// back-end/models/Stocktake.js
const mongoose = require('mongoose');

const stocktakeItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    systemStock: {
      type: Number,
      required: true, // Theoretical stock at time of stocktake (recipeUnit)
    },
    physicalCount: {
      type: Number,
      required: true, // Counted stock entered by manager (recipeUnit)
    },
    varianceQuantity: {
      type: Number,
      required: true, // physicalCount - systemStock
    },
    unitCost: {
      type: Number,
      required: true, // costPerRecipeUnit
    },
    varianceValue: {
      type: Number,
      required: true, // varianceQuantity * unitCost (negative = loss, positive = gain)
    },
    discrepancyReason: {
      type: String,
      trim: true,
      default: 'Physical audit variance',
    },
  },
  { _id: false }
);

const stocktakeSchema = new mongoose.Schema(
  {
    stocktakeNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'RECONCILED'],
      default: 'SUBMITTED',
      index: true,
    },
    items: [stocktakeItemSchema],
    totalVarianceQuantity: {
      type: Number,
      default: 0,
    },
    totalShrinkageLoss: {
      type: Number,
      default: 0, // PKR total loss from negative variances
    },
    totalNetVarianceValue: {
      type: Number,
      default: 0, // PKR net financial adjustment
    },
    auditNotes: {
      type: String,
      trim: true,
    },
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reconciledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stocktake', stocktakeSchema);