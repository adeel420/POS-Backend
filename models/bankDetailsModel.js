const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
  {
    accountTitle: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    iban: { type: String, default: "" },
    instructions: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankDetails", bankDetailsSchema);
