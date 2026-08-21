// back-end/routes/autoReorderRoutes.js
const express = require('express');
const router = express.Router();
const {
  getReorderSuggestions,
  generateAutoReorderPO,
} = require('../controllers/autoReorderController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.get(
  '/suggestions',
  requirePermission(['inventory:view', 'purchase_orders:view'], true),
  getReorderSuggestions
);

router.post(
  '/generate-po',
  requirePermission('purchase_orders:create'),
  generateAutoReorderPO
);

module.exports = router;