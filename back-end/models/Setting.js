// models/Setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "Burger O'Clock" },
    siteTitle: { type: String, default: "Burger O'Clock - Best Burgers in Town" },
    storeLogo: { type: String, default: "" },
    adminLogo: { type: String, default: "" },
    favicon: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models?.Setting || mongoose.model('Setting', settingSchema);