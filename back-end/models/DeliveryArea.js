// back-end/models/DeliveryArea.js
const mongoose = require('mongoose');

const deliveryAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area / Neighborhood name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Karachi',
      index: true,
    },
    // Made optional so the system can auto-resolve dynamically based on proximity & kitchen queue load
    assignedBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 35,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.DeliveryArea || mongoose.model('DeliveryArea', deliveryAreaSchema);