const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { requireAdmin } = require("../middleware/role");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const router = express.Router();

router.get("/", jwtAuthMiddleware, getSettings);
router.put("/", jwtAuthMiddleware, requireAdmin, updateSettings);

module.exports = router;
