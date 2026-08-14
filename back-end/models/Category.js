const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. 'burgers'
    label: { type: String, required: true }, // e.g. 'Burgers'
    isShown: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);