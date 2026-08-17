// src/models/Banner.js
import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    desktopImage: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    link: { type: String, default: "" }, // e.g. "/#deals" or "/menu"
    ctaText: { type: String, default: "" }, // e.g. "Order Now"
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Banner || mongoose.model("Banner", BannerSchema);