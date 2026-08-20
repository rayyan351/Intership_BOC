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
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/')
  .get(requirePermission(['inventory:view', 'products:create', 'products:edit'], true), getInventoryItems)
  .post(requirePermission('inventory:create'), createInventoryItem);

router.get('/ledger', requirePermission('inventory:view'), getStockLedger);

router.route('/:id')
  .put(requirePermission('inventory:edit'), updateInventoryItem);

router.post('/:id/adjust', requirePermission(['inventory:adjust', 'inventory:edit'], true), adjustStock,logKitchenWastage);

module.exports = router;