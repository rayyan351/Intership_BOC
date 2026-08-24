// back-end/controllers/recipeController.js
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get all recipes (Products & Sub-Recipes) with live COGS and Margins
// @route   GET /api/recipes
// @access  Private (recipes:view)
const getAllRecipes = async (req, res) => {
  try {
    const { type, search } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;

    const recipes = await Recipe.find(filter)
      .populate('product', 'name price category isAvailable')
      .populate('outputInventoryItem', 'name sku currentStock costPerRecipeUnit recipeUnit')
      .populate('ingredients.inventoryItem', 'name sku category recipeUnit costPerRecipeUnit purchaseUnit')
      .sort({ createdAt: -1 });

    const formatted = recipes.map((r) => {
      let totalCost = 0;
      const ingredients = (r.ingredients || []).map((line) => {
        const item = line.inventoryItem;
        const unitCost = item?.costPerRecipeUnit || 0;
        const lineCost = Number(((line.quantityRequired || 0) * unitCost).toFixed(2));
        totalCost += lineCost;

        return {
          _id: item?._id,
          name: item?.name || 'Unknown Item',
          sku: item?.sku,
          unit: line.unit || item?.recipeUnit || 'g',
          quantityRequired: line.quantityRequired,
          unitCost,
          lineCost,
          notes: line.notes,
        };
      });

      totalCost = Number(totalCost.toFixed(2));
      const sellingPrice = r.product?.price || 0;
      const grossMargin = Number((sellingPrice - totalCost).toFixed(2));
      const marginPercent = sellingPrice > 0 ? Number(((grossMargin / sellingPrice) * 100).toFixed(1)) : 0;
      const costPerYieldUnit = r.batchYieldQuantity > 0 ? Number((totalCost / r.batchYieldQuantity).toFixed(4)) : totalCost;

      return {
        _id: r._id,
        type: r.type,
        name: r.type === 'PRODUCT_RECIPE' ? r.product?.name : r.name,
        prepCategory: r.prepCategory,
        product: r.product,
        outputInventoryItem: r.outputInventoryItem,
        batchYieldQuantity: r.batchYieldQuantity,
        yieldUnit: r.yieldUnit,
        preparationNotes: r.preparationNotes,
        assemblyTimeMinutes: r.assemblyTimeMinutes,
        ingredients,
        totalCost,
        costPerYieldUnit,
        sellingPrice,
        grossMargin,
        marginPercent,
      };
    });

    const finalResult = search
      ? formatted.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
      : formatted;

    res.status(200).json(finalResult);
  } catch (error) {
    console.error('Error in getAllRecipes:', error);
    res.status(500).json({ message: 'Error fetching recipes', error: error.message });
  }
};

// @desc    Get Recipe for a specific product
// @route   GET /api/recipes/product/:productId
// @access  Private (recipes:view)
const getRecipeByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const recipe = await Recipe.findOne({ product: productId, isActive: true }).populate(
      'ingredients.inventoryItem',
      'name sku category recipeUnit costPerRecipeUnit currentStock'
    );

    if (!recipe) {
      return res.status(200).json({
        product: { _id: product._id, name: product.name, price: product.price },
        hasRecipe: false,
        ingredients: [],
        totalCost: 0,
        grossMargin: product.price,
        marginPercentage: product.price > 0 ? 100 : 0,
      });
    }

    let totalCost = 0;
    const computedIngredients = recipe.ingredients.map((item) => {
      const unitCost = item.inventoryItem?.costPerRecipeUnit || 0;
      const ingredientCost = Number((item.quantityRequired * unitCost).toFixed(2));
      totalCost += ingredientCost;

      return {
        _id: item.inventoryItem?._id,
        name: item.inventoryItem?.name,
        sku: item.inventoryItem?.sku,
        recipeUnit: item.inventoryItem?.recipeUnit,
        unitCost,
        quantityRequired: item.quantityRequired,
        totalItemCost: ingredientCost,
        notes: item.notes,
      };
    });

    totalCost = Number(totalCost.toFixed(2));
    const grossMargin = Number((product.price - totalCost).toFixed(2));
    const marginPercentage = product.price > 0 ? Number(((grossMargin / product.price) * 100).toFixed(2)) : 0;

    res.status(200).json({
      _id: recipe._id,
      product: { _id: product._id, name: product.name, price: product.price },
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

// @desc    Create or Update a Recipe (Product Recipe or Sub-Recipe Prep)
// @route   POST /api/recipes
// @access  Private (recipes:create, recipes:edit)
const saveRecipe = async (req, res) => {
  try {
    const {
      _id,
      type,
      productId,
      name,
      prepCategory,
      batchYieldQuantity,
      yieldUnit,
      outputInventoryItem,
      ingredients,
      preparationNotes,
      assemblyTimeMinutes,
    } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'A recipe must contain at least one ingredient.' });
    }

    if (type === 'PRODUCT_RECIPE' && !productId) {
      return res.status(400).json({ message: 'A Product Recipe must be linked to a menu product.' });
    }

    if (type === 'SUB_RECIPE_PREP' && !name) {
      return res.status(400).json({ message: 'Sub-recipe / Sauce name is required.' });
    }

    const formattedIngredients = [];
    for (const item of ingredients) {
      const invId = item.inventoryItem || item._id;
      const inventoryDoc = await InventoryItem.findById(invId);
      if (!inventoryDoc) {
        return res.status(400).json({ message: `Raw material ID ${invId} does not exist.` });
      }

      formattedIngredients.push({
        inventoryItem: inventoryDoc._id,
        quantityRequired: Number(item.quantityRequired),
        unit: inventoryDoc.recipeUnit,
        notes: item.notes || '',
      });
    }

    let recipe;
    if (_id) {
      recipe = await Recipe.findById(_id);
    } else if (type === 'PRODUCT_RECIPE') {
      recipe = await Recipe.findOne({ product: productId, type: 'PRODUCT_RECIPE' });
    }

    if (recipe) {
      recipe.type = type || recipe.type;
      recipe.product = type === 'PRODUCT_RECIPE' ? productId : null;
      recipe.name = type === 'SUB_RECIPE_PREP' ? name.trim() : '';
      recipe.prepCategory = prepCategory || recipe.prepCategory;
      recipe.batchYieldQuantity = Number(batchYieldQuantity) || 1;
      recipe.yieldUnit = yieldUnit || 'g';
      recipe.outputInventoryItem = outputInventoryItem || null;
      recipe.ingredients = formattedIngredients;
      recipe.preparationNotes = preparationNotes || '';
      recipe.assemblyTimeMinutes = Number(assemblyTimeMinutes) || 5;
      await recipe.save();
    } else {
      recipe = new Recipe({
        type: type || 'PRODUCT_RECIPE',
        product: type === 'PRODUCT_RECIPE' ? productId : null,
        name: type === 'SUB_RECIPE_PREP' ? name.trim() : '',
        prepCategory: prepCategory || 'Sauces & Dressings',
        batchYieldQuantity: Number(batchYieldQuantity) || 1,
        yieldUnit: yieldUnit || 'g',
        outputInventoryItem: outputInventoryItem || null,
        ingredients: formattedIngredients,
        preparationNotes: preparationNotes || '',
        assemblyTimeMinutes: Number(assemblyTimeMinutes) || 5,
      });
      await recipe.save();
    }

    res.status(200).json({ message: 'Recipe saved successfully', recipe });
  } catch (error) {
    console.error('Error in saveRecipe:', error);
    res.status(500).json({ message: 'Error saving recipe', error: error.message });
  }
};

// @desc    Produce/Cook a Batch of Sub-Recipe (Sauce prep) -> Deducts raw ingredients & credits output stock
// @route   POST /api/recipes/:id/produce-batch
// @access  Private (recipes:edit, inventory:adjust)
const produceSubRecipeBatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { branchId, batchMultiplier = 1 } = req.body;

    if (!branchId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Branch kitchen outlet is required for batch production.' });
    }

    const recipe = await Recipe.findById(id).populate('ingredients.inventoryItem').session(session);
    if (!recipe || recipe.type !== 'SUB_RECIPE_PREP') {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Sub-recipe / Sauce formulation not found.' });
    }

    const multiplier = Number(batchMultiplier) || 1;
    const totalYieldGrams = (recipe.batchYieldQuantity || 1000) * multiplier;
    const ledgerEntries = [];
    let totalBatchCost = 0;

    // 1. Deduct all raw ingredients from branch stock
    for (const line of recipe.ingredients) {
      const invItem = await InventoryItem.findById(line.inventoryItem._id).session(session);
      if (!invItem) continue;

      let branchStock = invItem.branchStocks.find((bs) => bs.branch.toString() === branchId.toString());
      if (!branchStock) {
        invItem.branchStocks.push({ branch: branchId, currentStock: 0, reorderLevel: 500, idealStock: 5000 });
        branchStock = invItem.branchStocks[invItem.branchStocks.length - 1];
      }

      const neededQty = line.quantityRequired * multiplier;
      const prevStock = branchStock.currentStock;
      branchStock.currentStock = Math.max(0, prevStock - neededQty);
      await invItem.save({ session });

      const lineCost = neededQty * (invItem.costPerRecipeUnit || 0);
      totalBatchCost += lineCost;

      ledgerEntries.push({
        item: invItem._id,
        branch: branchId,
        type: 'SPOILAGE_WASTE', // Production depletion
        quantityChanged: -neededQty,
        previousStock: prevStock,
        newStock: branchStock.currentStock,
        unitCostAtTime: invItem.costPerRecipeUnit,
        totalMonetaryValue: lineCost,
        performedBy: req.user?._id || null,
        notes: `Prep Batch Consumption: ${recipe.name} (${multiplier}x batch)`,
      });
    }

    // 2. Credit the output prepped sauce if tracked in inventory
    if (recipe.outputInventoryItem) {
      const outItem = await InventoryItem.findById(recipe.outputInventoryItem).session(session);
      if (outItem) {
        let outBranchStock = outItem.branchStocks.find((bs) => bs.branch.toString() === branchId.toString());
        if (!outBranchStock) {
          outItem.branchStocks.push({ branch: branchId, currentStock: 0, reorderLevel: 500, idealStock: 5000 });
          outBranchStock = outItem.branchStocks[outItem.branchStocks.length - 1];
        }

        const prevOutStock = outBranchStock.currentStock;
        outBranchStock.currentStock = prevOutStock + totalYieldGrams;

        // Auto-recalculate prepped sauce recipe unit cost
        const costPerGram = Number((totalBatchCost / totalYieldGrams).toFixed(4));
        outItem.costPerRecipeUnit = costPerGram;
        outItem.costPerPurchaseUnit = Number((costPerGram * (outItem.conversionFactor || 1000)).toFixed(2));
        await outItem.save({ session });

        ledgerEntries.push({
          item: outItem._id,
          branch: branchId,
          type: 'PURCHASE_INWARD', // Production creation
          quantityChanged: totalYieldGrams,
          previousStock: prevOutStock,
          newStock: outBranchStock.currentStock,
          unitCostAtTime: costPerGram,
          totalMonetaryValue: totalBatchCost,
          performedBy: req.user?._id || null,
          notes: `Batch Prep Production: ${recipe.name} (${totalYieldGrams} ${recipe.yieldUnit})`,
        });
      }
    }

    if (ledgerEntries.length > 0) {
      await StockTransaction.insertMany(ledgerEntries, { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Successfully prepped ${totalYieldGrams} ${recipe.yieldUnit} of ${recipe.name}. Raw stock deducted and sauce balance credited.`,
      batchYield: totalYieldGrams,
      totalCost: totalBatchCost,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Batch Production Error:', error);
    res.status(500).json({ message: 'Batch production failed', error: error.message });
  }
};

// @desc    Delete Recipe
// @route   DELETE /api/recipes/:id
// @access  Private (recipes:delete)
const deleteRecipe = async (req, res) => {
  try {
    await Recipe.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ message: 'Recipe archived successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete recipe', error: error.message });
  }
};

module.exports = {
  getAllRecipes,
  getRecipeByProduct,
  saveRecipe,
  produceSubRecipeBatch,
  deleteRecipe,
};