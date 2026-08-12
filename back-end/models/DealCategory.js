// back-end/models/DealCategory.js
const mongoose = require('mongoose');

const dealCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    isShown: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DealCategory', dealCategorySchema);