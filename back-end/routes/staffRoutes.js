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
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/')
  .get(requirePermission('staff:view'), getStaffMembers)
  .post(requirePermission('staff:create'), createStaffMember);

router.route('/:id')
  .put(requirePermission('staff:edit'), updateStaffMember)
  .delete(requirePermission('staff:delete'), deleteStaffMember);

module.exports = router;