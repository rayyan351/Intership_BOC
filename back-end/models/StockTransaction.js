// back-end/models/StockTransaction.js
const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'PURCHASE_INWARD',
        'SPOILAGE_WASTE',
        'PHYSICAL_AUDIT_ADJUSTMENT',
        'SALE_OUTWARD',           // Added for order depletion
        'SALE_RETURN',            // Added for cancelled order rollback
        'TRANSFER_OUT',
        'TRANSFER_IN'
      ],
    },
    quantityChanged: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    unitCostAtTime: {
      type: Number,
      default: 0,
    },
    totalMonetaryValue: {
      type: Number,
      default: 0,
    },
    // Changed to false: Storefront customer orders won't have an admin user ID
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, 
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);