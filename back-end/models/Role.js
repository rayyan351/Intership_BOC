// back-end/models/Role.js
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false, // Prevents deletion of core roles like Super Admin
    },
    color: {
      type: String,
      default: "blue",
    },
  },
  { timestamps: true }
);

// Auto-generate URL-friendly slug
roleSchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  }
});

module.exports = mongoose.models.Role || mongoose.model("Role", roleSchema);