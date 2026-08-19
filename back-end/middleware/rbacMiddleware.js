// back-end/middleware/rbacMiddleware.js
const { ROLES } = require("../config/roleBasedPermissions");

// back-end/middleware/rbacMiddleware.js

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    const userRole = (req.user.role || '').toLowerCase().trim();

    if (
      userRole === 'super_admin' ||
      userRole === 'admin' ||
      allowedRoles.map((r) => r.toLowerCase()).includes(userRole)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden. Role [${req.user.role}] does not have access to this resource.`,
    });
  };
};

const requirePermission = (requiredPermissions = [], matchAny = false) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }

    const userRole = (req.user.role || '').toLowerCase().trim();

    // Master bypass for Super Admin / Admin
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    const userPermissions = req.user.effectivePermissions || req.user.customPermissions || [];

    // Bypass if user has wildcard full access
    if (userPermissions.includes('*')) {
      return next();
    }

    const permissionsArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasAccess = matchAny
      ? permissionsArray.some((perm) => userPermissions.includes(perm))
      : permissionsArray.every((perm) => userPermissions.includes(perm));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have the required permissions.',
        missingPermissions: permissionsArray.filter((p) => !userPermissions.includes(p)),
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
};