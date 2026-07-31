const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { requireAdmin } = require("../middleware/role");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getLoginData,
  getCashiers,
  addCashier,
  deleteCashier,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.get("/login-data", jwtAuthMiddleware, getLoginData);
router.get("/cashiers", jwtAuthMiddleware, requireAdmin, getCashiers);
router.post("/cashier", jwtAuthMiddleware, requireAdmin, addCashier);
router.delete("/cashier/:id", jwtAuthMiddleware, requireAdmin, deleteCashier);

module.exports = router;
