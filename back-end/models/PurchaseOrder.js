// back-end/models/PurchaseOrder.js
const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item reference is required'],
    },
    orderedQuantity: {
      type: Number,
      required: true, // Quantity in item.purchaseUnit (e.g., 20 kg or 50 cartons)
      min: [0.01, 'Quantity must be greater than 0'],
    },
    receivedQuantity: {
      type: Number, // Filled upon physical receiving (handles partial deliveries)
      default: 0,
    },
    unitPurchasePrice: {
      type: Number,
      required: true, // Cost per purchaseUnit (e.g. Rs. 2,500 / kg)
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true, // orderedQuantity * unitPurchasePrice
    },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, // e.g. PO-202608-001
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Target branch outlet is required'],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
    },
    items: [poItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
    supplierInvoiceNo: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);