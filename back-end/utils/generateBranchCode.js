// back-end/utils/generateCodes.js
const mongoose = require("mongoose");

const CITY_PREFIXES = {
  Karachi: "KHI",
  Lahore: "LHE",
  Islamabad: "ISB",
  Rawalpindi: "RWP",
  Default: "BRN",
};

/**
 * Generates sequential Branch Code (e.g. KHI-001, LHE-002)
 */
async function generateBranchCode(city) {
  const prefix = CITY_PREFIXES[city] || CITY_PREFIXES.Default;
  const Branch = mongoose.models.Branch || mongoose.model("Branch");

  // Find the highest sequence number for this city prefix
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

/**
 * Generates sequential Employee ID (e.g. EMP-1001)
 */
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