const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Grab The Wraps"
    slug: { type: String, required: true, unique: true }, // e.g. "grab-the-wraps"
    subtitle: { type: String, default: "" },
    banner: { type: String, default: "" }, // <-- ADDED: Section divider artwork
    displayOrder: { type: Number, default: 0 },
    isShown: { type: Boolean, default: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    deals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', sectionSchema);