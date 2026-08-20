// back-end/routes/branchRoutes.js
const express = require('express');
const router = express.Router();
const {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

// Allow access to getBranches if user has locations:view OR staff:view (for outlet dropdowns)
router.route('/')
  .get(requirePermission(['locations:view', 'staff:view'], true), getBranches)
  .post(requirePermission('locations:create'), createBranch);

router.route('/:id')
  .put(requirePermission('locations:edit'), updateBranch)
  .delete(requirePermission('locations:delete'), deleteBranch);

module.exports = router;