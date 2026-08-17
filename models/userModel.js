const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    businessName: { type: String, required: true },
    phone: { type: String, default: "" },
    businessType: {
      type: String,
      enum: ["retail", "restaurant", "pharmacy", "grocery"],
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    verificationCode: String,
    resetPasswordOTP: String,
    resetPasswordExpires: Date,
    role: {
      type: String,
      enum: ["superadmin", "admin", "cashier"],
      default: "admin",
    },
    tenantStatus: {
      type: String,
      enum: ["Active", "Inactive", "Trial"],
      default: "Active",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    selectedPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },
    paymentProof: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash password before saving (only if modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
