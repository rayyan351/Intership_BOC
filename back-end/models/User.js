// back-end/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateEmployeeId } = require("../utils/generateBranchCode");

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Do not expose password by default
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    role: {
      type: String,
      default: 'staff',
      trim: true,
      lowercase: true,
      index: true,
    },
    customPermissions: {
      type: [String],
      default: [], // User-specific capabilities override
    },
    // Null for Super Admin, populated for Branch Staff/Managers
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    branchCode: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate employeeId and sync branchCode
userSchema.pre("save", async function () {
  if (this.role !== "super_admin" && !this.employeeId) {
    this.employeeId = await generateEmployeeId();
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has specific permission (Super Admin or has user override / role permission)
userSchema.methods.hasPermission = function (permissionKey) {
  if (this.role === 'super_admin' || this.role === 'admin') return true;
  return this.customPermissions.includes(permissionKey);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);