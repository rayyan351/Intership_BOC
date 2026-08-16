// src/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    categories: [{ type: String }],
    price: { type: Number, required: true, min: 0, default: 0 },
    compareAtPrice: { type: Number, default: null },
    discountLabel: { type: String, default: null },
    image: { type: String },
    isShown: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    isDealOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", productSchema);