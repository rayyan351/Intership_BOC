// back-end/models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    customizations: [
      {
        name: String,
        additionalPrice: { type: Number, default: 0 },
      },
    ],
    itemTotal: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, trim: true },
      address: { type: String, required: true },
      landmark: { type: String },
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch outlet reference is required'],
      index: true,
    },
    orderType: {
      type: String,
      enum: ['DELIVERY', 'TAKEAWAY', 'DINE_IN'],
      default: 'DELIVERY',
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'CARD', 'ONLINE'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    orderNotes: {
      type: String,
      trim: true,
    },
    inventoryDepleted: {
      type: Boolean,
      default: false,
    },
    // Add to back-end/models/Order.js schema fields:
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    cancelledBy: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SYSTEM', 'NONE'],
      default: 'NONE',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'VOID'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);