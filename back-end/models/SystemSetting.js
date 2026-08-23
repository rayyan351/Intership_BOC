// back-end/models/SystemSetting.js
const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'GLOBAL_RESTAURANT_CONFIG',
    },
    taxSettings: {
      codTaxPercentage: {
        type: Number,
        default: 15, // Standard 15% SST
        min: 0,
        max: 100,
      },
      cardTaxPercentage: {
        type: Number,
        default: 13, // Reduced 13% for card/digital
        min: 0,
        max: 100,
      },
      taxLabel: {
        type: String,
        default: 'Sindh Sales Tax (SST)',
      },
      isTaxEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);