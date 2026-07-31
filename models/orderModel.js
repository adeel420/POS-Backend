const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    variant: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served"],
      default: "pending",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: { type: Number, required: true },
    invoiceNo: { type: String, default: "" },
    table: { type: String, default: "" },
    server: { type: String, default: "" },
    guests: { type: Number, default: 1, min: 1 },
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway"],
      default: "dine-in",
    },
    customer: {
      name: { type: String, default: "Walk-in" },
      phone: { type: String, default: "" },
    },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["fixed", "percent", ""],
      default: "",
    },
    tax: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", ""],
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed", "settled", "cancelled"],
      default: "active",
    },
    splitWays: { type: Number, default: 1, min: 1 },
    time: { type: String, default: "" },
    settledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, orderId: 1 }, { unique: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
