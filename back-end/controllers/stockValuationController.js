// back-end/controllers/stockValuationController.js
const InventoryItem = require('../models/InventoryItem');
const Branch = require('../models/Branch');

// @desc    Get consolidated & branch-level stock asset valuation and balance sheet
// @route   GET /api/inventory/analytics/valuation
// @access  Private (inventory:view, reports:view)
const getStockValuationReport = async (req, res) => {
  try {
    const { branchId } = req.query;

    const branches = await Branch.find({ isActive: { $ne: false } }).select('name city branchCode');
    const items = await InventoryItem.find({ isActive: { $ne: false } })
      .populate('primarySupplier', 'name paymentTerms')
      .populate('branchStocks.branch', 'name city branchCode')
      .lean();

    let totalConsolidatedValuation = 0;
    let totalStockUnitsConsolidated = 0;

    const categoryMap = new Map(); // Category -> { totalValue, totalItems, percentage }
    const branchMap = new Map();   // BranchId -> { branchName, city, totalValue, totalSkus }

    // Initialize branchMap
    branches.forEach((b) => {
      branchMap.set(b._id.toString(), {
        branchId: b._id,
        branchName: b.name,
        city: b.city,
        totalValuation: 0,
        skuCount: 0,
      });
    });

    const evaluatedItems = [];

    for (const item of items) {
      const unitCost = Number(item.costPerRecipeUnit || 0);
      const category = item.category || 'General';

      let itemTotalStock = 0;
      let itemTotalValue = 0;

      const branchBreakdown = [];

      for (const bs of (item.branchStocks || [])) {
        if (!bs.branch) continue;

        const bId = (bs.branch._id || bs.branch).toString();
        
        // Filter by branch if requested
        if (branchId && bId !== branchId.toString()) {
          continue;
        }

        const stock = Number(bs.currentStock || 0);
        const val = Number((stock * unitCost).toFixed(2));

        itemTotalStock += stock;
        itemTotalValue += val;

        branchBreakdown.push({
          branchId: bId,
          branchName: bs.branch.name,
          currentStock: stock,
          valuation: val,
        });

        // Accumulate branch level totals
        if (branchMap.has(bId)) {
          const bData = branchMap.get(bId);
          bData.totalValuation = Number((bData.totalValuation + val).toFixed(2));
          if (stock > 0) bData.skuCount += 1;
        }
      }

      if (branchId && branchBreakdown.length === 0) {
        continue;
      }

      totalConsolidatedValuation += itemTotalValue;
      totalStockUnitsConsolidated += itemTotalStock;

      // Accumulate category level totals
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalValuation: 0,
          itemCount: 0,
        });
      }
      const catData = categoryMap.get(category);
      catData.totalValuation = Number((catData.totalValuation + itemTotalValue).toFixed(2));
      catData.itemCount += 1;

      evaluatedItems.push({
        _id: item._id,
        name: item.name,
        sku: item.sku,
        category,
        recipeUnit: item.recipeUnit,
        purchaseUnit: item.purchaseUnit,
        conversionFactor: item.conversionFactor,
        costPerRecipeUnit: unitCost,
        costPerPurchaseUnit: item.costPerPurchaseUnit || 0,
        primarySupplier: item.primarySupplier?.name || 'Unassigned',
        totalStock: itemTotalStock,
        totalValuation: Number(itemTotalValue.toFixed(2)),
        branches: branchBreakdown,
      });
    }

    // Compute Category Percentages
    const categoryDistribution = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      percentage:
        totalConsolidatedValuation > 0
          ? Number(((cat.totalValuation / totalConsolidatedValuation) * 100).toFixed(1))
          : 0,
    })).sort((a, b) => b.totalValuation - a.totalValuation);

    // Compute Branch Percentages
    const branchDistribution = Array.from(branchMap.values()).map((b) => ({
      ...b,
      percentage:
        totalConsolidatedValuation > 0
          ? Number(((b.totalValuation / totalConsolidatedValuation) * 100).toFixed(1))
          : 0,
    })).sort((a, b) => b.totalValuation - a.totalValuation);

    res.status(200).json({
      summary: {
        totalAssetValuation: Number(totalConsolidatedValuation.toFixed(2)),
        totalStockUnits: totalStockUnitsConsolidated,
        totalSkus: evaluatedItems.length,
        activeBranchesCount: branchDistribution.filter((b) => b.totalValuation > 0).length,
      },
      categoryDistribution,
      branchDistribution,
      items: evaluatedItems.sort((a, b) => b.totalValuation - a.totalValuation),
    });
  } catch (error) {
    console.error('Error generating stock valuation report:', error);
    res.status(500).json({ message: 'Failed to generate stock valuation report', error: error.message });
  }
};

module.exports = {
  getStockValuationReport,
};