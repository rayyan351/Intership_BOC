// back-end/utils/generateCodes.js
const mongoose = require("mongoose");

const KNOWN_PREFIXES = {
  karachi: "KHI",
  lahore: "LHE",
  islamabad: "ISB",
  rawalpindi: "RWP",
  peshawar: "PEW",
  faisalabad: "FSD",
  multan: "MUL",
  quetta: "UET",
  hyderabad: "HYD",
};

function getCityPrefix(cityName) {
  if (!cityName) return "BRN";
  const clean = cityName.trim().toLowerCase();
  if (KNOWN_PREFIXES[clean]) return KNOWN_PREFIXES[clean];

  // Fallback: take first 3 alphanumeric characters
  const lettersOnly = clean.replace(/[^a-z]/g, "");
  if (lettersOnly.length >= 3) {
    return lettersOnly.substring(0, 3).toUpperCase();
  }
  return "BRN";
}

/**
 * Generates sequential Branch Code (e.g. KHI-001, HYD-001, ISB-003)
 */
async function generateBranchCode(city) {
  const prefix = getCityPrefix(city);
  const Branch = mongoose.models.Branch || mongoose.model("Branch");

  const lastBranch = await Branch.findOne({
    branchCode: new RegExp(`^${prefix}-\\d+`, "i"),
  })
    .sort({ createdAt: -1 })
    .select("branchCode")
    .lean();

  let nextSequence = 1;
  if (lastBranch?.branchCode) {
    const parts = lastBranch.branchCode.split("-");
    const num = parseInt(parts[1], 10);
    if (!isNaN(num)) nextSequence = num + 1;
  }

  return `${prefix}-${String(nextSequence).padStart(3, "0")}`;
}

async function generateEmployeeId() {
  const User = mongoose.models.User || mongoose.model("User");

  const lastUser = await User.findOne({
    employeeId: new RegExp(`^EMP-\\d+`, "i"),
  })
    .sort({ createdAt: -1 })
    .select("employeeId")
    .lean();

  let nextSequence = 1001;
  if (lastUser?.employeeId) {
    const parts = lastUser.employeeId.split("-");
    const num = parseInt(parts[1], 10);
    if (!isNaN(num)) nextSequence = num + 1;
  }

  return `EMP-${nextSequence}`;
}

module.exports = {
  generateBranchCode,
  generateEmployeeId,
};