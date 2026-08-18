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
      // Extract token from header "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token payload
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'burger_oclock_secret_key_2026'
      );

      // Attach user object with populated branch details (excluding password)
      const user = await User.findById(decoded.id)
        .populate('branch', 'name city branchCode isShown')
        .select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found or token invalid' });
      }

      // Ensure staff account is active
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Your account has been deactivated. Please contact Super Admin.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };