// back-end/controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Helper to compute effective permissions
const getEffectivePermissions = (user) => {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return ['*'];
  }
  const rolePerms = user.roleId?.permissions || [];
  const customPerms = user.customPermissions || [];
  return Array.from(new Set([...rolePerms, ...customPerms]));
};

// @desc    Auth user & get token (Login via Email or Employee ID)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginIdentifier = (identifier || email || '').trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Please provide Email/Employee ID and Password' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { employeeId: loginIdentifier.toUpperCase() },
      ],
    })
      .select('+password')
      .populate('roleId', 'name slug permissions')
      .populate('branch', 'name city branchCode isShown');

    if (user && (await user.matchPassword(password))) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Your account is deactivated. Please contact Super Admin.',
        });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const permissions = getEffectivePermissions(user);

      res.json({
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        branchCode: user.branchCode,
        permissions,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('roleId', 'name slug permissions')
      .populate('branch', 'name city branchCode isShown')
      .select('-password');

    if (user) {
      const permissions = getEffectivePermissions(user);

      res.json({
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        branchCode: user.branchCode,
        permissions,
        isActive: user.isActive,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email ? req.body.email.toLowerCase().trim() : user.email;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      const populatedUser = await User.findById(updatedUser._id)
        .populate('roleId', 'name slug permissions')
        .populate('branch', 'name city branchCode isShown')
        .select('-password');

      const permissions = getEffectivePermissions(populatedUser);

      res.json({
        _id: populatedUser._id,
        employeeId: populatedUser.employeeId,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        branch: populatedUser.branch,
        branchCode: populatedUser.branchCode,
        permissions,
        token: generateToken(populatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  getUserProfile,
  updateUserProfile,
};