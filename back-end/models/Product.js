// back-end/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  categories: [{ type: String }],
  price: { type: Number, required: true },
  compareAtPrice: { type: Number, default: null },
  discountLabel: { type: String, default: null },
  image: { type: String },
  isShown: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);