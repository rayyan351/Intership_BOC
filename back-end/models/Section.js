const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Grab The Wraps"
    slug: { type: String, required: true, unique: true }, // e.g. "grab-the-wraps"
    subtitle: { type: String },
    displayOrder: { type: Number, default: 0 },
    isShown: { type: Boolean, default: true },
    // References to Products or Deals explicitly assigned to this section
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    deals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', sectionSchema);