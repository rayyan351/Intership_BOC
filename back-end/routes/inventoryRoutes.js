// back-end/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  getStockLedger,
  logKitchenWastage,
  getLowStockAlerts, // 1. Added import
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { getRecipeMarginAnalytics } = require('../controllers/recipeAnalyticsController');
const { getStockValuationReport } = require('../controllers/stockValuationController');

router.use(protect);

// 1. Root Collection Routes
router
  .route('/')
  .get(requirePermission(['inventory:view', 'products:create', 'products:edit'], true), getInventoryItems)
  .post(requirePermission('inventory:create'), createInventoryItem);

// 2. Specific Static Sub-routes (MUST be before /:id)
router.get('/ledger', requirePermission('inventory:view'), getStockLedger);
router.get('/alerts/low-stock', requirePermission('inventory:view'), getLowStockAlerts);

// 3. Specific Dynamic /:id Action Routes
router.post('/:id/adjust', requirePermission(['inventory:adjust', 'inventory:edit'], true), adjustStock);
router.post('/:id/spoilage', requirePermission(['inventory:adjust', 'inventory:edit'], true), logKitchenWastage);

// 4. General Dynamic /:id CRUD Routes
router
  .route('/:id')
  .put(requirePermission('inventory:edit'), updateInventoryItem);

router.get(
  '/analytics/recipe-margins',
  requirePermission(['inventory:view', 'recipes:view'], true),
  getRecipeMarginAnalytics
); 

router.get(
  '/analytics/valuation',
  requirePermission(['inventory:view', 'reports:view'], true),
  getStockValuationReport
);

module.exports = router;