// back-end/controllers/staffController.js
const User = require('../models/User');
const Branch = require('../models/Branch');
const { ROLES, ROLE_DEFAULT_PERMISSIONS } = require('../config/roleBasedPermissions');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Super Admin)
const getStaffMembers = async (req, res) => {
  try {
    const staff = await User.find({ role: { $ne: ROLES.SUPER_ADMIN } })
      .populate('branch', 'name city branchCode')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff members', error: error.message });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (Super Admin)
const createStaffMember = async (req, res) => {
  try {
    const { name, email, password, role, branch, permissions } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    let branchCode = null;
    if (branch) {
      const branchDoc = await Branch.findById(branch);
      if (branchDoc) branchCode = branchDoc.branchCode;
    }

    const staffMember = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      branch: branch || null,
      branchCode,
      permissions: permissions && permissions.length > 0
        ? permissions
        : (ROLE_DEFAULT_PERMISSIONS[role] || []),
      isActive: true,
    });

    const populatedStaff = await User.findById(staffMember._id)
      .populate('branch', 'name city branchCode')
      .select('-password');

    res.status(201).json(populatedStaff);
  } catch (error) {
    res.status(400).json({ message: 'Error creating staff member', error: error.message });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Super Admin)
const updateStaffMember = async (req, res) => {
  try {
    const { name, email, password, role, branch, permissions, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (permissions) user.permissions = permissions;

    if (branch !== undefined) {
      user.branch = branch || null;
      if (branch) {
        const branchDoc = await Branch.findById(branch);
        user.branchCode = branchDoc ? branchDoc.branchCode : null;
      } else {
        user.branchCode = null;
      }
    }

    if (password) {
      user.password = password; // Will be hashed via pre-save hook
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('branch', 'name city branchCode')
      .select('-password');

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Error updating staff member', error: error.message });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private (Super Admin)
const deleteStaffMember = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.status(200).json({ message: 'Staff member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting staff member', error: error.message });
  }
};

module.exports = {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
};