// back-end/routes/purchaseOrderRoutes.js
const express = require('express');
const router = express.Router();
const {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePOStatus,
  receivePurchaseOrder,
} = require('../controllers/purchaseOrderController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router
  .route('/')
  .get(requirePermission(['purchase_orders:view', 'inventory:view'], true), getPurchaseOrders)
  .post(requirePermission('purchase_orders:create'), createPurchaseOrder);

router.put(
  '/:id/status',
  requirePermission(['purchase_orders:edit', 'purchase_orders:create'], true),
  updatePOStatus
);

router.post(
  '/:id/receive',
  requirePermission(['purchase_orders:receive', 'inventory:adjust'], true),
  receivePurchaseOrder
);

module.exports = router;