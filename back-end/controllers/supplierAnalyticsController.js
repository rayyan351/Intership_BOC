// back-end/controllers/supplierAnalyticsController.js
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get vendor performance scorecards, lead times, and price variance
// @route   GET /api/suppliers/analytics/performance
// @access  Private (suppliers:view, purchase_orders:view)
const getSupplierPerformanceAnalytics = async (req, res) => {
  try {
    const suppliers = await Supplier.find().lean();
    const purchaseOrders = await PurchaseOrder.find()
      .populate('supplier', 'name phone email paymentTerms')
      .populate('branch', 'name city')
      .populate('items.item', 'name sku purchaseUnit')
      .lean();

    const supplierMetricsMap = new Map();

    // Initialize all suppliers
    suppliers.forEach((s) => {
      supplierMetricsMap.set(s._id.toString(), {
        supplierId: s._id,
        name: s.name,
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        paymentTerms: s.paymentTerms || 'Standard',
        totalOrders: 0,
        completedOrders: 0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        totalOrderedUnits: 0,
        totalReceivedUnits: 0,
        totalQuotedAmount: 0,
        totalActualAmount: 0,
        totalLeadTimeDays: 0,
        deliveredOrdersWithLeadTime: 0,
      });
    });

    purchaseOrders.forEach((po) => {
      if (!po.supplier) return;
      const sId = (po.supplier._id || po.supplier).toString();

      if (!supplierMetricsMap.has(sId)) {
        supplierMetricsMap.set(sId, {
          supplierId: sId,
          name: po.supplier.name || 'Unassigned Supplier',
          phone: po.supplier.phone || '',
          email: po.supplier.email || '',
          paymentTerms: po.supplier.paymentTerms || 'Net 30',
          totalOrders: 0,
          completedOrders: 0,
          onTimeDeliveries: 0,
          lateDeliveries: 0,
          totalOrderedUnits: 0,
          totalReceivedUnits: 0,
          totalQuotedAmount: 0,
          totalActualAmount: 0,
          totalLeadTimeDays: 0,
          deliveredOrdersWithLeadTime: 0,
        });
      }

      const metric = supplierMetricsMap.get(sId);
      metric.totalOrders += 1;

      let poQuotedAmount = 0;
      let poActualAmount = 0;

      (po.items || []).forEach((line) => {
        const ordered = Number(line.orderedQuantity || line.orderedUnits || 0);
        const received = Number(line.receivedQuantity || line.receivedUnits || 0);
        const quotedPrice = Number(line.unitPurchasePrice || line.costPerPurchaseUnit || 0);
        
        metric.totalOrderedUnits += ordered;
        metric.totalReceivedUnits += received;

        poQuotedAmount += ordered * quotedPrice;
        poActualAmount += received > 0 ? (line.subtotal || line.totalPrice || received * quotedPrice) : ordered * quotedPrice;
      });

      metric.totalQuotedAmount += poQuotedAmount;
      metric.totalActualAmount += poActualAmount;

      // Fulfillment Timing & Lead Time Calculations
      if (po.status === 'RECEIVED' && po.receivedAt) {
        metric.completedOrders += 1;

        const createdDate = new Date(po.createdAt);
        const receivedDate = new Date(po.receivedAt);
        const leadDays = Math.max(0, Math.round((receivedDate - createdDate) / (1000 * 60 * 60 * 24)));

        metric.totalLeadTimeDays += leadDays;
        metric.deliveredOrdersWithLeadTime += 1;

        if (po.expectedDeliveryDate) {
          const expectedDate = new Date(po.expectedDeliveryDate);
          if (receivedDate <= expectedDate) {
            metric.onTimeDeliveries += 1;
          } else {
            metric.lateDeliveries += 1;
          }
        } else {
          // If no expected date was set, count as standard delivery
          metric.onTimeDeliveries += 1;
        }
      }
    });

    const evaluatedScorecards = Array.from(supplierMetricsMap.values()).map((m) => {
      const onTimeRate =
        m.completedOrders > 0
          ? Number(((m.onTimeDeliveries / m.completedOrders) * 100).toFixed(1))
          : 100;

      const fillRate =
        m.totalOrderedUnits > 0
          ? Number(((m.totalReceivedUnits / m.totalOrderedUnits) * 100).toFixed(1))
          : 100;

      // Purchase Price Variance % = ((Actual - Quoted) / Quoted) * 100
      const priceVariancePercentage =
        m.totalQuotedAmount > 0
          ? Number((((m.totalActualAmount - m.totalQuotedAmount) / m.totalQuotedAmount) * 100).toFixed(1))
          : 0;

      const averageLeadTimeDays =
        m.deliveredOrdersWithLeadTime > 0
          ? Number((m.totalLeadTimeDays / m.deliveredOrdersWithLeadTime).toFixed(1))
          : 0;

      // Reliability Tier Grading
      let reliabilityTier = 'EXCELLENT'; // Green
      if (onTimeRate < 75 || fillRate < 80 || priceVariancePercentage > 8) {
        reliabilityTier = 'AT_RISK'; // Red
      } else if (onTimeRate < 90 || fillRate < 92 || priceVariancePercentage > 3) {
        reliabilityTier = 'MODERATE'; // Amber
      }

      return {
        supplierId: m.supplierId,
        name: m.name,
        phone: m.phone,
        email: m.email,
        paymentTerms: m.paymentTerms,
        totalOrders: m.totalOrders,
        completedOrders: m.completedOrders,
        onTimeRate,
        fillRate,
        averageLeadTimeDays,
        priceVariancePercentage,
        totalSpend: Number(m.totalActualAmount.toFixed(2)),
        reliabilityTier,
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);

    // Consolidated Metrics
    const totalVendors = evaluatedScorecards.length;
    const avgOnTime =
      totalVendors > 0
        ? Number((evaluatedScorecards.reduce((acc, s) => acc + s.onTimeRate, 0) / totalVendors).toFixed(1))
        : 100;
    const avgFillRate =
      totalVendors > 0
        ? Number((evaluatedScorecards.reduce((acc, s) => acc + s.fillRate, 0) / totalVendors).toFixed(1))
        : 100;
    const atRiskVendorsCount = evaluatedScorecards.filter((s) => s.reliabilityTier === 'AT_RISK').length;

    res.status(200).json({
      summary: {
        totalVendors,
        avgOnTime,
        avgFillRate,
        atRiskVendorsCount,
        totalProcurementSpend: evaluatedScorecards.reduce((acc, s) => acc + s.totalSpend, 0),
      },
      scorecards: evaluatedScorecards,
    });
  } catch (error) {
    console.error('Error generating supplier analytics:', error);
    res.status(500).json({ message: 'Failed to generate supplier performance analytics', error: error.message });
  }
};

module.exports = {
  getSupplierPerformanceAnalytics,
};