const PosType = require("../models/posTypeModel");

const getPosTypes = async (req, res) => {
  try {
    const posTypes = await PosType.find().sort({ order: 1, createdAt: 1 });
    res.status(200).json(posTypes);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

const createPosType = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const count = await PosType.countDocuments();
    const posType = await PosType.create({ name, description, color, order: count + 1 });
    res.status(201).json(posType);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "POS type name already exists" });
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatePosType = async (req, res) => {
  try {
    const posType = await PosType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!posType) return res.status(404).json({ error: "POS type not found" });
    res.status(200).json(posType);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

const deletePosType = async (req, res) => {
  try {
    const posType = await PosType.findByIdAndDelete(req.params.id);
    if (!posType) return res.status(404).json({ error: "POS type not found" });
    res.status(200).json({ message: "POS type deleted successfully" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getPosTypes, createPosType, updatePosType, deletePosType };
