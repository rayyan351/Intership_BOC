// back-end/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { createStripePaymentIntent,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus, } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Customer checkout can post without token or with guest checkout
router.post('/create-payment-intent', createStripePaymentIntent);
router.post('/', createOrder);
router.get('/:id', getOrderById);

// Admin dashboard order management
router.get('/', protect, requirePermission('orders:view', true), getOrders);
router.put('/:id/status', protect, requirePermission('orders:edit', true), updateOrderStatus);

module.exports = router;