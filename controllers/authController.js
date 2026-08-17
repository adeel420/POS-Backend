const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Plan = require("../models/planModel");
const { sendVerificationCode, welcomeCode, sendAccountApproved, sendAccountRejected } = require("../middleware/email");
const { generateToken } = require("../middleware/jwt");
const { uploadToCloudinary } = require("../middleware/upload");

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
      accountStatus: "pending",
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

    if (user.role === "admin" && user.accountStatus === "pending") {
      return res.status(400).json({ error: "Your account is pending approval. Please wait for admin approval." });
    }

    if (user.role === "admin" && user.accountStatus === "rejected") {
      return res.status(400).json({ error: `Your account has been rejected. Reason: ${user.rejectionReason || "Contact support"}` });
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
        accountStatus: user.accountStatus,
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

    res.status(200).json({
      message: "Email verified successfully",
      accountStatus: user.accountStatus,
    });
  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const selectPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ error: "Invalid or inactive plan" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { selectedPlan: planId },
      { new: true }
    ).select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Plan selected successfully", user });
  } catch (err) {
    console.error("Select Plan Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadPaymentProof = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "Payment proof image is required" });
    }

    const result = await uploadToCloudinary(req.file);

    const user = await User.findByIdAndUpdate(
      userId,
      { paymentProof: result.secure_url, accountStatus: "pending" },
      { new: true }
    ).select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Payment proof uploaded successfully", user });
  } catch (err) {
    console.error("Upload Payment Proof Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const approveTenant = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    tenant.accountStatus = "approved";
    tenant.rejectionReason = "";
    await tenant.save();

    try {
      await sendAccountApproved(tenant.email, tenant.name);
    } catch (emailErr) {
      console.error("Approval email failed:", emailErr.message);
    }

    const updated = await User.findById(req.params.id).select(
      "-password -verificationCode -resetPasswordOTP -resetPasswordExpires"
    );

    res.status(200).json({ message: "Tenant approved successfully", tenant: updated });
  } catch (err) {
    console.error("Approve Tenant Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const rejectTenant = async (req, res) => {
  try {
    const { reason } = req.body;
    const tenant = await User.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    tenant.accountStatus = "rejected";
    tenant.rejectionReason = reason || "";
    await tenant.save();

    try {
      await sendAccountRejected(tenant.email, tenant.name, reason);
    } catch (emailErr) {
      console.error("Rejection email failed:", emailErr.message);
    }

    const updated = await User.findById(req.params.id).select(
      "-password -verificationCode -resetPasswordOTP -resetPasswordExpires"
    );

    res.status(200).json({ message: "Tenant rejected", tenant: updated });
  } catch (err) {
    console.error("Reject Tenant Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getPendingTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: "admin", accountStatus: "pending" })
      .select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires")
      .populate("selectedPlan", "name price");
    res.status(200).json(tenants);
  } catch (err) {
    console.error("Get Pending Tenants Error:", err);
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

    const user = await User.findById(userId)
      .select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires")
      .populate("selectedPlan", "name price color features");
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
      accountStatus: user.accountStatus,
      selectedPlan: user.selectedPlan,
      paymentProof: user.paymentProof,
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
      accountStatus: "approved",
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

const getTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: "admin" })
      .select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires")
      .populate("selectedPlan", "name price");
    res.status(200).json(tenants);
  } catch (err) {
    console.error("Get Tenants Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateTenantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Active", "Inactive", "Trial"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const tenant = await User.findByIdAndUpdate(
      req.params.id,
      { tenantStatus: status },
      { new: true }
    ).select("-password -verificationCode -resetPasswordOTP -resetPasswordExpires");
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    res.status(200).json(tenant);
  } catch (err) {
    console.error("Update Tenant Status Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
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
};
