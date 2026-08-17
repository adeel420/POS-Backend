const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { requireSuperAdmin } = require("../middleware/role");
const { getPlans, createPlan, updatePlan, deletePlan } = require("../controllers/planController");

const router = express.Router();

router.get("/", getPlans);
router.post("/", jwtAuthMiddleware, requireSuperAdmin, createPlan);
router.put("/:id", jwtAuthMiddleware, requireSuperAdmin, updatePlan);
router.delete("/:id", jwtAuthMiddleware, requireSuperAdmin, deletePlan);

module.exports = router;
