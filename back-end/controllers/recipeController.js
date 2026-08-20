// back-end/controllers/recipeController.js
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');

// @desc    Get recipe for a specific product with real-time calculated COGS & margin
// @route   GET /api/recipes/product/:productId
// @access  Private (recipes:view, products:view)
const getRecipeByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const recipe = await Recipe.findOne({ product: productId, isActive: true }).populate(
      'ingredients.inventoryItem',
      'name sku category recipeUnit costPerRecipeUnit currentStock purchaseUnit'
    );

    if (!recipe) {
      return res.status(200).json({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
        },
        hasRecipe: false,
        ingredients: [],
        totalCost: 0,
        grossMargin: product.price,
        marginPercentage: product.price > 0 ? 100 : 0,
      });
    }

    // Dynamic COGS calculation based on current inventory unit costs
    let totalCost = 0;
    const computedIngredients = recipe.ingredients.map((item) => {
      const unitCost = item.inventoryItem?.costPerRecipeUnit || 0;
      const ingredientCost = Number((item.quantityRequired * unitCost).toFixed(2));
      totalCost += ingredientCost;

      return {
        _id: item.inventoryItem?._id,
        name: item.inventoryItem?.name,
        sku: item.inventoryItem?.sku,
        category: item.inventoryItem?.category,
        recipeUnit: item.inventoryItem?.recipeUnit,
        unitCost,
        quantityRequired: item.quantityRequired,
        totalItemCost: ingredientCost,
        notes: item.notes,
      };
    });

    totalCost = Number(totalCost.toFixed(2));
    const grossMargin = Number((product.price - totalCost).toFixed(2));
    const marginPercentage =
      product.price > 0 ? Number(((grossMargin / product.price) * 100).toFixed(2)) : 0;

    res.status(200).json({
      _id: recipe._id,
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
      },
      hasRecipe: true,
      ingredients: computedIngredients,
      preparationNotes: recipe.preparationNotes,
      assemblyTimeMinutes: recipe.assemblyTimeMinutes,
      totalCost,
      grossMargin,
      marginPercentage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipe', error: error.message });
  }
};

// @desc    Upsert (Create or Update) a Product BOM Recipe
// @route   POST /api/recipes/product/:productId
// @access  Private (recipes:create, recipes:edit)
const upsertRecipe = async (req, res) => {
  try {
    const { productId } = req.params;
    const { ingredients, preparationNotes, assemblyTimeMinutes } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'A recipe must contain at least one ingredient.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Verify all inventory items and map units
    const formattedIngredients = [];
    for (const item of ingredients) {
      const inventoryDoc = await InventoryItem.findById(item.inventoryItem);
      if (!inventoryDoc) {
        return res.status(400).json({ message: `Raw material ID ${item.inventoryItem} does not exist.` });
      }

      formattedIngredients.push({
        inventoryItem: inventoryDoc._id,
        quantityRequired: Number(item.quantityRequired),
        unit: inventoryDoc.recipeUnit,
        notes: item.notes || '',
      });
    }

    let recipe = await Recipe.findOne({ product: productId });

    if (recipe) {
      recipe.ingredients = formattedIngredients;
      recipe.preparationNotes = preparationNotes;
      recipe.assemblyTimeMinutes = Number(assemblyTimeMinutes) || 5;
      await recipe.save();
    } else {
      recipe = new Recipe({
        product: productId,
        ingredients: formattedIngredients,
        preparationNotes,
        assemblyTimeMinutes: Number(assemblyTimeMinutes) || 5,
      });
      await recipe.save();
    }

    res.status(200).json({ message: 'Recipe specification saved successfully', recipe });
  } catch (error) {
    res.status(500).json({ message: 'Error saving recipe', error: error.message });
  }
};

module.exports = { getRecipeByProduct, upsertRecipe };