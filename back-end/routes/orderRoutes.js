// back-end/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { createStripePaymentIntent,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus, 
  cancelCustomerOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const rateLimit = require('../middleware/rateLimit');

// The tracking page polls every few seconds, so 90 a minute leaves room for normal use.
const trackingLimit = rateLimit({ windowMs: 60 * 1000, max: 90 });

// Customer checkout can post without token or with guest checkout
router.post('/create-payment-intent', createStripePaymentIntent);
router.post('/', createOrder);
router.get('/:id', trackingLimit, getOrderById);
router.post('/:id/cancel-customer', trackingLimit, cancelCustomerOrder);

// Admin dashboard order management
router.get('/', protect, requirePermission('orders:view', true), getOrders);
router.put('/:id/status', protect, requirePermission('orders:edit', true), updateOrderStatus);
// Add delete route with auth check
router.delete('/:id', protect, requirePermission('orders:delete', true), deleteOrder);

module.exports = router;