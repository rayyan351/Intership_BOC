// models/Branch.js
const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch / Area name is required'],
      trim: true,
    }, // e.g. "SMCHS", "Clifton", "Gulberg"
    city: {
      type: String,
      required: [true, 'City is required'],
      enum: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi'],
      default: 'Karachi',
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    isShown: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models?.Branch || mongoose.model('Branch', branchSchema);