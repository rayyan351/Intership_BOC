// back-end/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Public read: Customer storefront menu listing
router.get('/', getProducts);

// Protected admin mutations
router.post(
  '/',
  protect,
  requirePermission('products:create'),
  upload.single('image'),
  createProduct
);

router.put(
  '/:id',
  protect,
  requirePermission(['products:edit', 'products:toggle_stock'], true),
  upload.single('image'),
  updateProduct
);

router.delete(
  '/:id',
  protect,
  requirePermission('products:delete'),
  deleteProduct
);

module.exports = router;