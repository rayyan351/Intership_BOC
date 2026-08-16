// src/models/Section.js
import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subtitle: { type: String },
    displayOrder: { type: Number, default: 0 },
    isShown: { type: Boolean, default: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    deals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
  },
  { timestamps: true }
);

export default mongoose.models.Section || mongoose.model("Section", sectionSchema);