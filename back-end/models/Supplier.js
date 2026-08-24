// back-end/models/Supplier.js
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier business name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      required: [true, 'Supplier phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    taxNumber: {
      type: String,
      trim: true,
      default: '',
    },
    paymentTerms: {
      type: String,
      enum: ['COD', 'NET_7', 'NET_15', 'NET_30', 'PREPAID'],
      default: 'COD',
    },
    categoriesSupplied: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Modern synchronous pre-save hook (no next parameter needed)
supplierSchema.pre('save', function () {
  if (!this.supplierCode && this.name) {
    const cleanPrefix = this.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') || 'SUP';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.supplierCode = `SUP-${cleanPrefix}-${randomSuffix}`;
  }
});

module.exports = mongoose.model('Supplier', supplierSchema);