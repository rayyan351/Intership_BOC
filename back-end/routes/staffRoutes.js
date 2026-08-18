// back-end/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/roleBasedPermissions');

// All staff management routes are protected for Super Admin only
router.use(protect, requireRole(ROLES.SUPER_ADMIN));

router.route('/')
  .get(getStaffMembers)
  .post(createStaffMember);

router.route('/:id')
  .put(updateStaffMember)
  .delete(deleteStaffMember);

module.exports = router;