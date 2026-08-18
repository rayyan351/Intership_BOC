// back-end/models/Branch.js
const mongoose = require("mongoose");
const { generateBranchCode } = require("../utils/generateCodes");

const branchSchema = new mongoose.Schema(
  {
    branchCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      enum: ["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
      default: "Karachi",
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    // Coordinates for Google Maps & Geolocation
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    googleMapsUrl: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryRadiusKm: {
      type: Number,
      default: 8, // Standard 8km delivery zone
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, "Delivery fee cannot be negative"],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    isShown: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

branchSchema.pre("save", async function (next) {
  if (!this.branchCode) {
    try {
      this.branchCode = await generateBranchCode(this.city);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.models.Branch || mongoose.model("Branch", branchSchema);