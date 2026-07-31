const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },
    server: { type: String, default: "" },
    guests: { type: Number, default: 0 },
    guest: { type: String, default: "" },
    order: { type: Number, default: null },
    time: { type: String, default: "" },
  },
  { timestamps: true }
);

const Table = mongoose.model("Table", tableSchema);
module.exports = Table;
