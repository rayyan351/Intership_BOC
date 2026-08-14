// back-end/models/Deal.js
const mongoose = require('mongoose');

const fixedItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const choiceOptionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    name: {
      type: String,
      required: true, // e.g. "Chipotle Mayo Dip" or "Cheese Burger Fries"
    },
    extraPrice: {
      type: Number,
      default: 0,
      min: 0, // e.g. 300 for upgrade, 0 for standard
    },
  },
  { _id: true }
);

const choiceGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    selectCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    required: {
      type: Boolean,
      default: true,
    },
    options: [choiceOptionSchema],
  },
  { _id: true }
);

const dealSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
    },
    dealType: {
      type: String,
      required: [true, 'Deal type/category is required'],
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: 0,
    },
    dealPrice: {
      type: Number,
      required: [true, 'Deal price is required'],
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '/placeholder.png',
    },
    isShown: {
      type: Boolean,
      default: true,
    },
    fixedItems: [fixedItemSchema],
    choiceGroups: [choiceGroupSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deal', dealSchema);