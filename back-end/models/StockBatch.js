// back-end/models/StockBatch.js
const mongoose = require('mongoose');

const stockBatchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true, // e.g. LOT-BEEF-20260822-001
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item reference is required'],
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch outlet reference is required'],
      index: true,
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      default: null,
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: [0, 'Initial quantity cannot be negative'],
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: [0, 'Remaining quantity cannot be negative'],
    },
    unitCost: {
      type: Number,
      required: true, // Cost per recipeUnit at time of receiving
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required for perishable batches'],
      index: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEPLETED', 'EXPIRED', 'DISCARDED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Virtual status helper
stockBatchSchema.methods.updateStatusBasedOnExpiry = function () {
  if (this.remainingQuantity <= 0) {
    this.status = 'DEPLETED';
  } else if (new Date() > new Date(this.expiryDate)) {
    this.status = 'EXPIRED';
  } else {
    this.status = 'ACTIVE';
  }
};

module.exports = mongoose.model('StockBatch', stockBatchSchema);