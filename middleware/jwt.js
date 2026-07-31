const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await User.findById(verified.id).select(
      "-password -verificationCode -resetPasswordOTP -resetPasswordExpires"
    );
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const tenantId =
      user.role === "cashier" && user.ownerId ? user.ownerId.toString() : user._id.toString();

    req.user = {
      id: tenantId,
      userId: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { jwtAuthMiddleware, generateToken };
