// back-end/routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllRecipes,
  getRecipeByProduct,
  saveRecipe,
  produceSubRecipeBatch,
  deleteRecipe,
} = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router
  .route('/')
  .get(requirePermission(['recipes:view', 'products:view', 'inventory:view'], true), getAllRecipes)
  .post(requirePermission(['recipes:create', 'recipes:edit'], true), saveRecipe);

router.get('/product/:productId', requirePermission('recipes:view', true), getRecipeByProduct);
router.post('/:id/produce-batch', requirePermission(['recipes:edit', 'inventory:adjust'], true), produceSubRecipeBatch);
router.delete('/:id', requirePermission('recipes:delete', true), deleteRecipe);

module.exports = router;