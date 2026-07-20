const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getLoginData,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.get("/login-data", jwtAuthMiddleware, getLoginData);

module.exports = router;
