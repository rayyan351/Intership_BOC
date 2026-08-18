// back-end/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES, PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } = require("../config/permissions");
const { generateEmployeeId } = require("../utils/generateCodes");

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
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.BRANCH_STAFF,
      index: true,
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
    permissions: {
      type: [String],
      enum: Object.values(PERMISSIONS),
      default: function () {
        return ROLE_DEFAULT_PERMISSIONS[this.role] || [];
      },
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
userSchema.pre("save", async function (next) {
  if (this.role !== ROLES.SUPER_ADMIN && !this.employeeId) {
    try {
      this.employeeId = await generateEmployeeId();
    } catch (err) {
      return next(err);
    }
  }

  // Password hashing
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function (permission) {
  if (this.role === ROLES.SUPER_ADMIN) return true;
  return this.permissions.includes(permission);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);