// back-end/middleware/rbacMiddleware.js
const { ROLES } = require("../config/roleBasedPermissions");

/**
 * Enforces role-level access.
 * e.g. requireRole(ROLES.SUPER_ADMIN)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthenticated." });
    }

    const userRole = (req.user.role || "").toLowerCase().trim();

    // Super Admin / Admin has master access
    const isSuperAdmin =
      userRole === "super_admin" ||
      userRole === "admin" ||
      userRole === ROLES?.SUPER_ADMIN;

    if (isSuperAdmin || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden. Role [${req.user.role}] does not have access to this resource.`,
    });
  };
};

/**
 * Enforces granular permission flags.
 * Super Admins automatically pass.
 */
const requirePermission = (requiredPermissions = [], matchAny = false) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthenticated." });
    }

    const userRole = (req.user.role || "").toLowerCase().trim();
    const isSuperAdmin =
      userRole === "super_admin" ||
      userRole === "admin" ||
      userRole === ROLES?.SUPER_ADMIN;

    // Master bypass for Super Admin
    if (isSuperAdmin) {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const permissionsArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const hasAccess = matchAny
      ? permissionsArray.some((perm) => userPermissions.includes(perm))
      : permissionsArray.every((perm) => userPermissions.includes(perm));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have the required permissions to perform this action.",
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