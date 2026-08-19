// back-end/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const {
  getRolesAndModules,
  createRole,
  updateRole,
  toggleRolePermission,
  batchUpdateRolePermissions,
  deleteRole,
} = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Ensure your user's role in MongoDB is 'super_admin' or 'admin'
router.use(protect, requireRole('super_admin', 'admin'));

router.route('/')
  .get(getRolesAndModules)
  .post(createRole);

router.route('/:id')
  .put(updateRole)
  .delete(deleteRole);

router.patch('/:id/toggle', toggleRolePermission);
router.put('/:id/batch-permissions', batchUpdateRolePermissions);

module.exports = router;