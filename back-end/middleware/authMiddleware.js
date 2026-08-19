// back-end/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'burger_oclock_secret_key_2026'
      );

      const userId = decoded.id || decoded._id || decoded.userId;
      const user = await User.findById(userId)
        .populate('roleId', 'name slug permissions')
        .populate('branch', 'name city branchCode isShown')
        .select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Compute dynamic permissions
      if (user.role === 'super_admin' || user.role === 'admin') {
        user.effectivePermissions = ['*'];
      } else {
        const rolePerms = user.roleId?.permissions || [];
        const customPerms = user.customPermissions || [];
        user.effectivePermissions = Array.from(new Set([...rolePerms, ...customPerms]));
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };