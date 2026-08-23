// back-end/routes/deliveryAreaRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDeliveryAreas,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
  getSystemSettings,
  updateSystemSettings,
} = require('../controllers/deliveryAreaController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Public endpoints
router.get('/', getDeliveryAreas);
router.get('/settings', getSystemSettings);

// Protected Admin endpoints
router.post('/', protect, requirePermission('settings:edit', true), createDeliveryArea);
router.put('/settings', protect, requirePermission('settings:edit', true), updateSystemSettings);
router.put('/:id', protect, requirePermission('settings:edit', true), updateDeliveryArea);
router.delete('/:id', protect, requirePermission('settings:edit', true), deleteDeliveryArea);

module.exports = router;