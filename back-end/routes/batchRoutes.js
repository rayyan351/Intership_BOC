// back-end/routes/batchRoutes.js
const express = require('express');
const router = express.Router();
const {
  getStockBatches,
  discardExpiredBatch,
} = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.get(
  '/',
  requirePermission(['inventory:view'], true),
  getStockBatches
);

router.post(
  '/:id/discard',
  requirePermission(['inventory:adjust'], true),
  discardExpiredBatch
);

module.exports = router;