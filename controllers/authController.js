const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const { sendVerificationCode, welcomeCode } = require("../middleware/email");
const { generateToken } = require("../middleware/jwt");

const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, businessName, phone, businessType } = req.body;

    if (!name || !email || !password || !businessName || !businessType) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password,
      businessName,
      phone: phone || "",
      businessType,
      verificationCode,
      role: "admin",
    });

    await user.save();

    try {
      await sendVerificationCode(email, verificationCode);
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr.message);
    }

    res.status(201).json({
      message: "Signup successful. Check your email for verification code",
      verificationCode,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = generateToken({ id: user._id });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName,
        businessType: user.businessType,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Verification code is required" });
    }

    const user = await User.findOne({ verificationCode: code.toString() });
    if (!user) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    await welcomeCode(user.email, user.name);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save({ validateBeforeSave: false });

    await sendVerificationCode(email, otp);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordExpires) {
      return res.status(400).json({ error: "OTP was not requested" });
    }

    if (user.resetPasswordOTP !== otp.toString()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getLoginData = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID is missing" });
    }

    const user = await User.findById(userId).select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      businessName: user.businessName,
      phone: user.phone,
      businessType: user.businessType,
      role: user.role,
    });
  } catch (err) {
    console.error("Login Data Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCashiers = async (req, res) => {
  try {
    const cashiers = await User.find({ ownerId: req.user.id, role: "cashier" }).select(
      "-password -verificationCode -resetPasswordOTP -resetPasswordExpires"
    );
    res.status(200).json(
      cashiers.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: c.role,
        createdAt: c.createdAt,
      }))
    );
  } catch (err) {
    console.error("Get Cashiers Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addCashier = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const cashier = new User({
      name,
      email,
      password,
      phone: phone || "",
      businessName: admin.businessName,
      businessType: admin.businessType,
      role: "cashier",
      ownerId: admin._id,
      isVerified: true,
    });

    await cashier.save();

    res.status(201).json({
      message: "Cashier created successfully",
      cashier: {
        id: cashier._id,
        name: cashier.name,
        email: cashier.email,
        phone: cashier.phone,
        role: cashier.role,
        createdAt: cashier.createdAt,
      },
    });
  } catch (err) {
    console.error("Add Cashier Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteCashier = async (req, res) => {
  try {
    const { id } = req.params;

    const cashier = await User.findOneAndDelete({ _id: id, ownerId: req.user.id, role: "cashier" });
    if (!cashier) {
      return res.status(404).json({ error: "Cashier not found" });
    }

    res.status(200).json({ message: "Cashier deleted successfully" });
  } catch (err) {
    console.error("Delete Cashier Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getLoginData,
  getCashiers,
  addCashier,
  deleteCashier,
};
