// back-end/controllers/branchController.js
const Branch = require('../models/Branch');

// GET all active branches (Storefront & Admin)
const getBranches = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isShown: true };
    const branches = await Branch.find(filter).sort({ city: 1, displayOrder: 1, name: 1 });
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching branches', error: error.message });
  }
};

// POST create branch
const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(400).json({ message: 'Error creating branch', error: error.message });
  }
};

// PUT update branch
const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.status(200).json(branch);
  } catch (error) {
    res.status(400).json({ message: 'Error updating branch', error: error.message });
  }
};

// DELETE branch
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting branch', error: error.message });
  }
};

module.exports = { getBranches, createBranch, updateBranch, deleteBranch };