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

router.use(protect, requireRole('super_admin', 'admin'));

router.route('/')
  .get(getStaffMembers)
  .post(createStaffMember);

router.route('/:id')
  .put(updateStaffMember)
  .delete(deleteStaffMember);

module.exports = router;