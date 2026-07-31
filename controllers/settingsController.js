const Settings = require("../models/settingsModel");
const User = require("../models/userModel");

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      const user = await User.findById(req.user.id);
      settings = await Settings.create({
        userId: req.user.id,
        restaurantName: user?.businessName || "Restaurant",
      });
    }

    res.status(200).json(settings);
  } catch (err) {
    console.error("Get Settings Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { restaurantName, logoUrl, taxPercent, currency } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      {
        restaurantName: restaurantName ?? undefined,
        logoUrl: logoUrl ?? undefined,
        taxPercent: taxPercent === undefined ? undefined : Number(taxPercent),
        currency: currency ?? undefined,
      },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json(settings);
  } catch (err) {
    console.error("Update Settings Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getSettings, updateSettings };
