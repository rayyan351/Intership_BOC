// back-end/models/Supplier.js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier business name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Supplier phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    taxNumber: {
      type: String, // NTN / STRN in Pakistan
      trim: true,
    },
    paymentTerms: {
      type: String,
      enum: ['COD', 'NET_7', 'NET_15', 'NET_30', 'PREPAID'],
      default: 'COD',
    },
    categoriesSupplied: [
      {
        type: String,
        trim: true, // e.g. ['Meat', 'Packaging', 'Dairy']
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);