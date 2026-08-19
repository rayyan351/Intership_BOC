// back-end/controllers/staffController.js
const User = require('../models/User');
const Role = require('../models/Role');

// GET /api/staff (List all branch staff members)
const getStaffMembers = async (req, res) => {
  try {
    // Exclude root and HQ administrators from branch staff listings
    const staff = await User.find({ role: { $nin: ['super_admin', 'admin'] } })
      .populate('roleId', 'name slug permissions')
      .populate('branch', 'name city branchCode')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff members', error: error.message });
  }
};

// POST /api/staff (Create Staff User)
const createStaffMember = async (req, res) => {
  try {
    const { name, email, password, roleId, branchId, customPermissions } = req.body;

    if (!name || !email || !password || !branchId || !roleId) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const roleDoc = await Role.findById(roleId);
    if (!roleDoc) {
      return res.status(404).json({ message: 'Selected role not found' });
    }

    // Default to role permissions if no explicit custom overrides provided
    const finalPermissions = Array.isArray(customPermissions) && customPermissions.length > 0
      ? customPermissions
      : roleDoc.permissions;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: roleDoc.slug || 'staff',
      roleId: roleDoc._id,
      branch: branchId,
      customPermissions: finalPermissions,
    });

    const populatedUser = await User.findById(user._id)
      .populate('roleId', 'name slug permissions')
      .populate('branch', 'name city branchCode')
      .select('-password');

    res.status(201).json(populatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create staff member' });
  }
};

// PUT /api/staff/:id (Update Staff User)
const updateStaffMember = async (req, res) => {
  try {
    const { name, email, password, roleId, branchId, customPermissions, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (password) user.password = password; // Triggers bcrypt pre-save
    if (branchId) user.branch = branchId;
    if (isActive !== undefined) user.isActive = isActive;

    if (roleId) {
      const roleDoc = await Role.findById(roleId);
      if (roleDoc) {
        user.roleId = roleDoc._id;
        user.role = roleDoc.slug || 'staff';
      }
    }

    if (customPermissions !== undefined) {
      user.customPermissions = customPermissions;
    }

    await user.save();

    const updated = await User.findById(user._id)
      .populate('roleId', 'name slug permissions')
      .populate('branch', 'name city branchCode')
      .select('-password');

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update staff member' });
  }
};

// DELETE /api/staff/:id
const deleteStaffMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    await user.deleteOne();
    res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
};