const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const {
  getTables,
  addTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");

const router = express.Router();

router.get("/", jwtAuthMiddleware, getTables);
router.post("/", jwtAuthMiddleware, addTable);
router.put("/:id", jwtAuthMiddleware, updateTable);
router.delete("/:id", jwtAuthMiddleware, deleteTable);

module.exports = router;
