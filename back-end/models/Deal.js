// back-end/models/Deal.js
const mongoose = require('mongoose');

const dealItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

const dealSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    dealType: {
      type: String,
      required: true,
      default: 'Combo Deals', // e.g. 'Combo Deals', 'Premium Deals', 'Midnight Deals'
    },
    items: [dealItemSchema], // Included products and quantities
    originalPrice: { type: Number, required: true },
    dealPrice: { type: Number, required: true },
    image: { type: String, default: '/placeholder.png' },
    isShown: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deal', dealSchema);