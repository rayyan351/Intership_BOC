// back-end/routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const { getRecipeByProduct, upsertRecipe } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router
  .route('/product/:productId')
  .get(requirePermission(['recipes:view', 'products:view', 'inventory:view'], true), getRecipeByProduct)
  .post(requirePermission(['recipes:create', 'recipes:edit', 'products:edit'], true), upsertRecipe);

module.exports = router;