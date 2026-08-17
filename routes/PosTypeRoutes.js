const express = require("express");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const { requireSuperAdmin } = require("../middleware/role");
const { getPosTypes, createPosType, updatePosType, deletePosType } = require("../controllers/posTypeController");

const router = express.Router();

router.get("/", getPosTypes);
router.post("/", jwtAuthMiddleware, requireSuperAdmin, createPosType);
router.put("/:id", jwtAuthMiddleware, requireSuperAdmin, updatePosType);
router.delete("/:id", jwtAuthMiddleware, requireSuperAdmin, deletePosType);

module.exports = router;
