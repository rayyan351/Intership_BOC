// back-end/models/Branch.js
const mongoose = require("mongoose");
const { generateBranchCode } = require("../utils/generateBranchCode");

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
      default: 8,
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

// ✅ Modern Mongoose async hook (No `next` parameter or callback)
branchSchema.pre("save", async function () {
  if (!this.branchCode) {
    this.branchCode = await generateBranchCode(this.city);
  }
});

module.exports = mongoose.models.Branch || mongoose.model("Branch", branchSchema);