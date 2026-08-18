// back-end/controllers/branchController.js
const Branch = require("../models/Branch");

// Helper to sanitize incoming payload types
const sanitizeBranchData = (raw) => {
  const data = { ...raw };

  // Nullable GPS coordinates
  ["latitude", "longitude"].forEach((field) => {
    if (data[field] === "" || data[field] === undefined || data[field] === null) {
      data[field] = null;
    } else {
      const parsed = Number(data[field]);
      data[field] = isNaN(parsed) ? null : parsed;
    }
  });

  // Numeric defaults
  ["deliveryFee", "minOrderAmount", "displayOrder", "deliveryRadiusKm"].forEach((field) => {
    if (data[field] === "" || data[field] === undefined || data[field] === null) {
      data[field] = field === "deliveryRadiusKm" ? 8 : 0;
    } else {
      const parsed = Number(data[field]);
      data[field] = isNaN(parsed) ? 0 : parsed;
    }
  });

  return data;
};

// GET all active branches (Storefront & Admin)
const getBranches = async (req, res) => {
  try {
    const filter = req.query.all === "true" ? {} : { isShown: true };
    const branches = await Branch.find(filter).sort({ city: 1, displayOrder: 1, name: 1 });
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: "Error fetching branches", error: error.message });
  }
};

// POST create branch
const createBranch = async (req, res) => {
  try {
    const cleanData = sanitizeBranchData(req.body);
    const branch = await Branch.create(cleanData);
    res.status(201).json(branch);
  } catch (error) {
    console.error("Create Branch Error:", error);
    res.status(400).json({
      message: error.message || "Error creating branch",
      error: error.errors || error,
    });
  }
};

// PUT update branch
const updateBranch = async (req, res) => {
  try {
    const cleanData = sanitizeBranchData(req.body);
    const branch = await Branch.findByIdAndUpdate(req.params.id, cleanData, {
      new: true,
      runValidators: true,
    });

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json(branch);
  } catch (error) {
    console.error("Update Branch Error:", error);
    res.status(400).json({
      message: error.message || "Error updating branch",
      error: error.errors || error,
    });
  }
};

// DELETE branch
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting branch", error: error.message });
  }
};

module.exports = {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
};