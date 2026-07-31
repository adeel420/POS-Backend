const MenuItem = require("../models/menuModel");

const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.status(200).json(items);
  } catch (err) {
    console.error("Get Menu Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addMenuItem = async (req, res) => {
  try {
    const { name, category, price, variants } = req.body;

    if (!name || !category || price === undefined || price === null) {
      return res.status(400).json({ error: "Item name, category and price are required" });
    }

    const exists = await MenuItem.findOne({ userId: req.user.id, name });
    if (exists) {
      return res.status(400).json({ error: "Menu item with this name already exists" });
    }

    const item = new MenuItem({
      userId: req.user.id,
      name,
      category,
      price,
      variants: Array.isArray(variants) ? variants : [],
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error("Add Menu Item Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.variants && !Array.isArray(updates.variants)) {
      return res.status(400).json({ error: "Variants must be an array" });
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error("Update Menu Item Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (err) {
    console.error("Delete Menu Item Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem };
