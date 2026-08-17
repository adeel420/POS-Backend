const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { requireSuperAdmin } = require("../middleware/role");
const { getBankDetails, updateBankDetails } = require("../controllers/bankDetailsController");

const router = express.Router();

router.get("/", getBankDetails);
router.put("/", jwtAuthMiddleware, requireSuperAdmin, updateBankDetails);

module.exports = router;
