const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurantName: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    taxPercent: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "PKR" },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
