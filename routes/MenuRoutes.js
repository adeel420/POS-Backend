const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");

const router = express.Router();

router.get("/", jwtAuthMiddleware, getMenuItems);
router.post("/", jwtAuthMiddleware, addMenuItem);
router.put("/:id", jwtAuthMiddleware, updateMenuItem);
router.delete("/:id", jwtAuthMiddleware, deleteMenuItem);

module.exports = router;
