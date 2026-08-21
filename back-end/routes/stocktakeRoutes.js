// back-end/routes/stocktakeRoutes.js
const express = require('express');
const router = express.Router();
const {
  getStocktakes,
  submitStocktakeReconciliation,
} = require('../controllers/stocktakeController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router
  .route('/')
  .get(requirePermission(['inventory:view', 'stocktake:view'], true), getStocktakes)
  .post(requirePermission(['inventory:adjust', 'stocktake:create'], true), submitStocktakeReconciliation);

module.exports = router;