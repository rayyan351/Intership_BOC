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
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/')
  .get(requirePermission('roles:view'), getRolesAndModules)
  .post(requirePermission('roles:create'), createRole);

router.route('/:id')
  .put(requirePermission('roles:edit'), updateRole)
  .delete(requirePermission('roles:delete'), deleteRole);

router.patch('/:id/toggle', requirePermission('roles:edit'), toggleRolePermission);
router.put('/:id/batch-permissions', requirePermission('roles:edit'), batchUpdateRolePermissions);

module.exports = router;