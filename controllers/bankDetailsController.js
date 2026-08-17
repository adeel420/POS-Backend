const BankDetails = require("../models/bankDetailsModel");

const getBankDetails = async (req, res) => {
  try {
    const details = await BankDetails.findOne().sort({ createdAt: -1 });
    if (!details) {
      return res.status(404).json({ error: "Bank details not configured yet" });
    }
    res.status(200).json(details);
  } catch (err) {
    console.error("Get Bank Details Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateBankDetails = async (req, res) => {
  try {
    const { accountTitle, bankName, accountNumber, iban, instructions } = req.body;

    if (!accountTitle || !bankName || !accountNumber) {
      return res.status(400).json({ error: "Account title, bank name and account number are required" });
    }

    let details = await BankDetails.findOne();

    if (details) {
      details.accountTitle = accountTitle;
      details.bankName = bankName;
      details.accountNumber = accountNumber;
      details.iban = iban || "";
      details.instructions = instructions || "";
      await details.save();
    } else {
      details = await BankDetails.create({ accountTitle, bankName, accountNumber, iban, instructions });
    }

    res.status(200).json(details);
  } catch (err) {
    console.error("Update Bank Details Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getBankDetails, updateBankDetails };
