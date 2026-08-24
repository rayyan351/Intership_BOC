// back-end/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getStockLedger,
  logKitchenWastage,
  getLowStockAlerts,
  transferStockBetweenBranches,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

// 1. Root Collection Routes
router
  .route('/')
  .get(requirePermission(['inventory:view', 'products:create', 'products:edit'], true), getInventoryItems)
  .post(requirePermission(['inventory:create', 'inventory:edit'], true), createInventoryItem);

// 2. Specific Static Action & Report Routes (Placed before /:id)
router.get('/ledger', requirePermission('inventory:view', true), getStockLedger);
router.get('/alerts/low-stock', requirePermission('inventory:view', true), getLowStockAlerts);
router.post('/transfer', requirePermission(['inventory:adjust', 'inventory:edit'], true), transferStockBetweenBranches);

// 3. Dynamic Action Routes on Specific Item
router.post('/:id/adjust', requirePermission(['inventory:adjust', 'inventory:edit'], true), adjustStock);
router.post('/:id/spoilage', requirePermission(['inventory:adjust', 'inventory:edit'], true), logKitchenWastage);

// 4. Dynamic /:id CRUD
router
  .route('/:id')
  .put(requirePermission('inventory:edit', true), updateInventoryItem)
  .delete(requirePermission(['inventory:delete', 'inventory:edit'], true), deleteInventoryItem);

module.exports = router;