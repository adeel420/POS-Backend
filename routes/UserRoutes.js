const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { requireAdmin, requireSuperAdmin } = require("../middleware/role");
const { upload } = require("../middleware/upload");
const {
  signup,
  login,
  verifyEmail,
  selectPlan,
  uploadPaymentProof,
  approveTenant,
  rejectTenant,
  getPendingTenants,
  forgotPassword,
  resetPassword,
  getLoginData,
  getCashiers,
  addCashier,
  deleteCashier,
  getTenants,
  updateTenantStatus,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/select-plan", jwtAuthMiddleware, selectPlan);
router.post("/upload-payment-proof", jwtAuthMiddleware, upload.single("paymentProof"), uploadPaymentProof);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.get("/login-data", jwtAuthMiddleware, getLoginData);
router.get("/cashiers", jwtAuthMiddleware, requireAdmin, getCashiers);
router.post("/cashier", jwtAuthMiddleware, requireAdmin, addCashier);
router.delete("/cashier/:id", jwtAuthMiddleware, requireAdmin, deleteCashier);
router.get("/tenants", jwtAuthMiddleware, requireSuperAdmin, getTenants);
router.get("/pending-tenants", jwtAuthMiddleware, requireSuperAdmin, getPendingTenants);
router.patch("/tenant/:id/status", jwtAuthMiddleware, requireSuperAdmin, updateTenantStatus);
router.patch("/tenant/:id/approve", jwtAuthMiddleware, requireSuperAdmin, approveTenant);
router.patch("/tenant/:id/reject", jwtAuthMiddleware, requireSuperAdmin, rejectTenant);

module.exports = router;
