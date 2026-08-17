const Plan = require("../models/planModel");

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const createPlan = async (req, res) => {
  try {
    const { name, price, color, features } = req.body;
    if (!name || !price) return res.status(400).json({ error: "Name and price are required" });

    const plan = await Plan.create({ name, price, color, features });
    res.status(201).json(plan);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Plan name already exists" });
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.status(200).json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getPlans, createPlan, updatePlan, deletePlan };
