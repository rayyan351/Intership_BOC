// back-end/routes/dealCategoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDealCategories,
  createDealCategory,
  updateDealCategory,
  deleteDealCategory,
} = require('../controllers/dealCategoryController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Public read: Storefront & Admin listing
router.route('/')
  .get(getDealCategories)
  .post(protect, requirePermission('dealcategories:create'), createDealCategory);

router.route('/:id')
  .put(
    protect,
    requirePermission(['dealcategories:edit', 'dealcategories:status', 'dealcategories:toggle_stock'], true),
    updateDealCategory
  )
  .delete(protect, requirePermission('dealcategories:delete'), deleteDealCategory);

module.exports = router;