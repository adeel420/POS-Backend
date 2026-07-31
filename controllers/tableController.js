const Table = require("../models/tableModel");

const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.status(200).json(tables);
  } catch (err) {
    console.error("Get Tables Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addTable = async (req, res) => {
  try {
    const { name, capacity } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({ error: "Table name and capacity are required" });
    }

    const exists = await Table.findOne({ userId: req.user.id, name });
    if (exists) {
      return res.status(400).json({ error: "Table with this name already exists" });
    }

    const table = new Table({ userId: req.user.id, name, capacity });
    await table.save();
    res.status(201).json(table);
  } catch (err) {
    console.error("Add Table Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const table = await Table.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    res.status(200).json(table);
  } catch (err) {
    console.error("Update Table Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!table) {
      return res.status(404).json({ error: "Table not found" });
    }

    res.status(200).json({ message: "Table deleted successfully" });
  } catch (err) {
    console.error("Delete Table Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getTables, addTable, updateTable, deleteTable };
