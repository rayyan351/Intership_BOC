// back-end/controllers/orderController.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const {
  depleteInventoryForOrder,
  restoreInventoryForOrder,
} = require('../services/InventoryDepletionService');

// @desc    Get all orders with filtering
// @route   GET /api/orders
// @access  Private (orders:view)
const getOrders = async (req, res) => {
  try {
    const { branchId, status, orderType } = req.query;
    const filter = {};

    if (branchId) filter.branch = branchId;
    if (status) filter.orderStatus = status;
    if (orderType) filter.orderType = orderType;

    const orders = await Order.find(filter)
      .populate('branch', 'name city branchCode')
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 });

    res.status(200).json(orders || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// @desc    Create new order & automatically deplete kitchen raw inventory
// @route   POST /api/orders
// @access  Public / Private (POS / Storefront)
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customer,
      branch,
      orderType,
      items,
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      paymentMethod,
    } = req.body;

    if (!items || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

    if (!branch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Branch outlet selection is required.' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    const newOrder = new Order({
      orderNumber,
      customer,
      branch,
      orderType: orderType || 'DELIVERY',
      items,
      subtotal: Number(subtotal),
      tax: Number(tax) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
    });

    const savedOrder = await newOrder.save({ session });

    // Deduct raw ingredients from inventory using BOM recipe
    await depleteInventoryForOrder({
      orderItems: items,
      branchId: branch,
      orderNumber: savedOrder.orderNumber,
      userId: req.user?._id || null,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({
        message: 'Order cannot be fulfilled due to insufficient ingredient stock at this outlet.',
        shortages: error.details,
      });
    }

    console.error('Order checkout error:', error);
    res.status(500).json({ message: 'Order checkout failed', error: error.message });
  }
};

// @desc    Update order status (handles cancellation inventory rollback)
// @route   PUT /api/orders/:id/status
// @access  Private (orders:edit)
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // If order is changed to CANCELLED, roll back deducted raw materials
    if (orderStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      await restoreInventoryForOrder({
        orderItems: order.items,
        branchId: order.branch,
        orderNumber: order.orderNumber,
        userId: req.user?._id || null,
        session,
      });
    }

    const updatedOrder = await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(updatedOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
};