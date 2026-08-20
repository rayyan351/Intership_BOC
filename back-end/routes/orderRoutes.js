// back-end/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Customer checkout can post without token or with guest checkout
router.post('/', createOrder);

// Admin dashboard order management
router.get('/', protect, requirePermission('orders:view'), getOrders);
router.put('/:id/status', protect, requirePermission('orders:edit'), updateOrderStatus);

module.exports = router;