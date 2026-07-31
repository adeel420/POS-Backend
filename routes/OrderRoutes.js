const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/", jwtAuthMiddleware, getOrders);
router.post("/", jwtAuthMiddleware, addOrder);
router.put("/:id", jwtAuthMiddleware, updateOrder);
router.delete("/:id", jwtAuthMiddleware, deleteOrder);

module.exports = router;
