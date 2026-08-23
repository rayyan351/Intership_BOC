// back-end/models/DeliveryArea.js
const mongoose = require('mongoose');

const deliveryAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Karachi',
    },
    assignedBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Every area must be mapped to a fulfilling kitchen branch'],
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
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryArea', deliveryAreaSchema);