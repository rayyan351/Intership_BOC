// src/models/Order.js
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  dealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deal",
    required: false,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  isDeal: { type: Boolean, default: false },
  selectedChoices: { type: mongoose.Schema.Types.Mixed, default: {} },
  specialInstructions: { type: String, default: "" },
});

const OrderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      notes: { type: String, default: "" },
    },
    branch: {
      id: { type: String, default: "dha-sehar" },
      name: { type: String, default: "DHA Sehar" },
    },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);