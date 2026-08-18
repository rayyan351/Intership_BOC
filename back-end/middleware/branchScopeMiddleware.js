// back-end/middleware/branchScopeMiddleware.js
const { ROLES } = require("../config/permissions");

/**
 * Injects branch filters into req.branchFilter and req.body for write operations.
 */
const scopeBranch = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthenticated." });
  }

  // Super Admin can view all or optionally filter by branch in query
  if (req.user.role === ROLES.SUPER_ADMIN) {
    req.branchFilter = req.query.branchId ? { branch: req.query.branchId } : {};
    return next();
  }

  // Branch staff MUST have an assigned branch
  if (!req.user.branch) {
    return res.status(403).json({
      success: false,
      message: "No store branch is assigned to your account. Contact Super Admin.",
    });
  }

  const assignedBranchId = req.user.branch._id || req.user.branch;

  // Enforce read filter
  req.branchFilter = { branch: assignedBranchId };

  // Enforce write payload assignment
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    if (req.body) {
      req.body.branch = assignedBranchId;
      req.body.branchCode = req.user.branch.branchCode || req.user.branchCode;
    }
  }

  next();
};

module.exports = { scopeBranch };