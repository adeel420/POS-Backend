const mongoose = require("mongoose");

const posTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    color: { type: String, default: "from-teal-500 to-emerald-600" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PosType", posTypeSchema);
