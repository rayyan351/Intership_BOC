// back-end/controllers/recipeAnalyticsController.js
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');

// @desc    Get real-time recipe profitability, COGS, and ingredient contribution
// @route   GET /api/inventory/analytics/recipe-margins
// @access  Private (recipes:view, inventory:view)
const getRecipeMarginAnalytics = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('product', 'name price category sku isAvailable image')
      .populate('ingredients.inventoryItem', 'name sku recipeUnit costPerRecipeUnit costPerPurchaseUnit purchaseUnit')
      .lean();

    const analyzedItems = recipes
      .filter((r) => r.product)
      .map((recipe) => {
        let totalCostOfGoods = 0;

        const ingredientBreakdown = (recipe.ingredients || []).map((ing) => {
          const item = ing.inventoryItem || {};
          const qty = Number(ing.quantityRequired) || 0;
          const unitCost = Number(item.costPerRecipeUnit) || 0;
          const lineCost = Number((qty * unitCost).toFixed(2));
          totalCostOfGoods += lineCost;

          return {
            itemId: item._id,
            name: item.name || 'Raw Ingredient',
            sku: item.sku || 'N/A',
            quantityRequired: qty,
            recipeUnit: item.recipeUnit || 'unit',
            unitCost,
            lineCost,
          };
        });

        const sellingPrice = Number(recipe.product.price) || 0;
        const grossProfit = Number((sellingPrice - totalCostOfGoods).toFixed(2));
        const foodCostPercentage =
          sellingPrice > 0 ? Number(((totalCostOfGoods / sellingPrice) * 100).toFixed(1)) : 0;
        const grossMarginPercentage =
          sellingPrice > 0 ? Number(((grossProfit / sellingPrice) * 100).toFixed(1)) : 0;

        // Health Categorization: Ideal QSR Food Cost is 25% - 35%
        let marginHealth = 'OPTIMAL'; // Green
        if (foodCostPercentage > 40) {
          marginHealth = 'CRITICAL'; // Red (High COGS)
        } else if (foodCostPercentage > 33) {
          marginHealth = 'WARNING'; // Amber
        } else if (foodCostPercentage < 20 && sellingPrice > 0) {
          marginHealth = 'HIGH_MARGIN'; // Purple
        }

        // Compute % contribution of each ingredient to total COGS
        const ingredientsWithWeight = ingredientBreakdown.map((ing) => ({
          ...ing,
          costContributionPercentage:
            totalCostOfGoods > 0
              ? Number(((ing.lineCost / totalCostOfGoods) * 100).toFixed(1))
              : 0,
        }));

        return {
          recipeId: recipe._id,
          product: {
            id: recipe.product._id,
            name: recipe.product.name,
            sku: recipe.product.sku,
            category: recipe.product.category,
            sellingPrice,
            image: recipe.product.image,
          },
          totalCostOfGoods: Number(totalCostOfGoods.toFixed(2)),
          grossProfit,
          foodCostPercentage,
          grossMarginPercentage,
          marginHealth,
          ingredients: ingredientsWithWeight,
        };
      });

    // Summary Statistics
    const totalAnalyzed = analyzedItems.length;
    const avgFoodCostPct =
      totalAnalyzed > 0
        ? Number(
            (
              analyzedItems.reduce((acc, i) => acc + i.foodCostPercentage, 0) /
              totalAnalyzed
            ).toFixed(1)
          )
        : 0;

    const criticalItemsCount = analyzedItems.filter((i) => i.marginHealth === 'CRITICAL').length;
    const optimalItemsCount = analyzedItems.filter((i) => i.marginHealth === 'OPTIMAL' || i.marginHealth === 'HIGH_MARGIN').length;

    res.status(200).json({
      summary: {
        totalAnalyzed,
        avgFoodCostPct,
        criticalItemsCount,
        optimalItemsCount,
      },
      items: analyzedItems,
    });
  } catch (error) {
    console.error('Error calculating recipe margins:', error);
    res.status(500).json({ message: 'Failed to calculate recipe margins', error: error.message });
  }
};

module.exports = {
  getRecipeMarginAnalytics,
};