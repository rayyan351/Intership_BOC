// back-end/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Public read: Storefront & Admin listing
router.get('/', getCategories);

// Protected admin mutations
router.post(
  '/',
  protect,
  requirePermission('categories:create'),
  createCategory
);

router.put(
  '/:id',
  protect,
  requirePermission(['categories:edit', 'categories:status', 'categories:toggle_stock'], true),
  updateCategory
);

router.delete(
  '/:id',
  protect,
  requirePermission('categories:delete'),
  deleteCategory
);

module.exports = router;