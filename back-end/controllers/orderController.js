// back-end/controllers/orderController.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const axios = require('axios');
const Branch = require('../models/Branch');
const StockTransaction = require('../models/StockTransaction');
const {
  validateStockAvailability,
  depleteInventoryForOrder,
  restoreInventoryForOrder,
} = require('../services/inventoryDepletionService');

// @desc    Initiate Local Payment Session (Safepay / 1LINK / Raast Sandbox)
// @route   POST /api/orders/create-payment-intent
// @access  Public
const createStripePaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'PKR' } = req.body;
    const apiKey = process.env.SAFEPAY_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        message: 'SAFEPAY_API_KEY is not configured in backend environment.',
      });
    }

    const response = await axios.post(
      'https://sandbox.api.getsafepay.com/order/v1/init',
      {
        client: apiKey,
        amount: Math.round(Number(amount)),
        currency: currency.toUpperCase(),
        environment: 'sandbox',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const trackerToken = response.data?.data?.token;

    if (!trackerToken) {
      return res.status(500).json({ message: 'Safepay token generation failed' });
    }

    res.status(200).json({
      success: true,
      token: trackerToken,
      paymentIntentId: trackerToken,
    });
  } catch (error) {
    console.error('Safepay Backend Error:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to initialize Safepay transaction',
      error: error?.response?.data || error.message,
    });
  }
};
// @desc    Get all orders with filtering
// @route   GET /api/orders
// @access  Private (orders:view)
const getOrders = async (req, res) => {
  try {
    const { branchId, status, orderType, paymentStatus, search } = req.query;
    const filter = {};

    if (branchId) filter.branch = branchId;
    if (status) filter.orderStatus = status;
    if (orderType) filter.orderType = orderType;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter)
      .populate('branch', 'name city branchCode address phone')
      .populate('items.product', 'name price image category')
      .sort({ createdAt: -1 });

    res.status(200).json(orders || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// @desc    Get single order details by ID or orderNumber
// @route   GET /api/orders/:id
// @access  Public / Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id.toUpperCase() };

    const order = await Order.findOne(query)
      .populate('branch', 'name city branchCode address phone')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};

// @desc    Create new order & atomically deplete kitchen raw inventory (FEFO + Yield)
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
      transactionReference,
      orderNotes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

    if (!branch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Branch outlet selection is required.' });
    }

    if (!customer?.name || !customer?.phone || !customer?.address) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Customer name, phone, and delivery address are required.' });
    }

    let resolvedBranchId = null;
    if (typeof branch === 'string' && mongoose.Types.ObjectId.isValid(branch)) {
      resolvedBranchId = branch;
    } else if (branch?._id && mongoose.Types.ObjectId.isValid(branch._id)) {
      resolvedBranchId = branch._id;
    } else {
      const lookupTerm = branch?.name || branch?.id || (typeof branch === 'string' ? branch : '');
      let matchedBranch = null;

      if (lookupTerm) {
        matchedBranch = await Branch.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${lookupTerm}$`, 'i') } },
            { branchCode: { $regex: new RegExp(`^${lookupTerm}$`, 'i') } },
          ],
        }).session(session);
      }

      if (matchedBranch) {
        resolvedBranchId = matchedBranch._id;
      } else {
        let fallbackBranch = await Branch.findOne({ isActive: { $ne: false } }).session(session);
        if (!fallbackBranch) {
          fallbackBranch = new Branch({
            name: branch?.name || 'Main Kitchen Outlet',
            city: branch?.city || 'Karachi',
            branchCode: branch?.id || 'MAIN-01',
            address: branch?.address || 'Karachi Main',
            phone: branch?.phone || '021-111-432-532',
            isActive: true,
          });
          await fallbackBranch.save({ session });
        }
        resolvedBranchId = fallbackBranch._id;
      }
    }

    if (!resolvedBranchId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Could not resolve a valid branch outlet in the database.' });
    }

    // 1. Validate ingredient availability before order placement
    await validateStockAvailability({
      orderItems: items,
      branchId: resolvedBranchId,
      session,
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BOC-${dateStr}-${randomSuffix}`;

    const formattedItems = items.map((itm) => {
      const price = Number(itm.price) || 0;
      const qty = Number(itm.quantity) || 1;
      const itemTotal = Number(itm.itemTotal || price * qty);

      return {
        product: itm.product?._id || itm.product || itm.productId,
        name: itm.name,
        price,
        quantity: qty,
        customizations: itm.customizations || [],
        itemTotal,
        image: itm.image || '',
      };
    });

    const isDirectPaid = paymentMethod === 'CARD';
    const isBankTransfer = paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'RAAST';

    const newOrder = new Order({
      orderNumber,
      customer,
      branch: resolvedBranchId,
      orderType: orderType || 'DELIVERY',
      items: formattedItems,
      subtotal: Number(subtotal),
      tax: Number(tax) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isDirectPaid ? 'PAID' : isBankTransfer ? 'AWAITING_CONFIRMATION' : 'PENDING',
      stripePaymentIntentId: transactionReference || null,
      orderStatus: 'PENDING',
      orderNotes: orderNotes || '',
      inventoryDepleted: true,
    });

    const savedOrder = await newOrder.save({ session });

    // 2. Deplete raw inventory ingredients
    await depleteInventoryForOrder({
      orderItems: items,
      branchId: resolvedBranchId,
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

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (orders:edit)
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, cancellationReason } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.orderStatus;

    if (previousStatus === 'DELIVERED' || previousStatus === 'CANCELLED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Order is in terminal state '${previousStatus}' and cannot be modified further.`,
      });
    }

    if (orderStatus) order.orderStatus = orderStatus;

    if (orderStatus === 'DELIVERED') {
      order.paymentStatus = 'PAID';
    } else if (orderStatus === 'CANCELLED') {
      order.cancellationReason = cancellationReason || 'Order cancelled by restaurant manager.';
      order.cancelledBy = 'ADMIN';
      order.paymentStatus = order.paymentStatus === 'PAID' ? 'REFUNDED' : 'VOID';

      if (order.inventoryDepleted) {
        await restoreInventoryForOrder({
          orderItems: order.items,
          branchId: order.branch,
          orderNumber: order.orderNumber,
          userId: req.user?._id || null,
          session,
        });
        order.inventoryDepleted = false;
      }
    } else if (paymentStatus) {
      order.paymentStatus = paymentStatus;
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

// @desc    Customer self-service order cancellation
// @route   POST /api/orders/:id/cancel-customer
// @access  Public
const cancelCustomerOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id.toUpperCase() };
    const order = await Order.findOne(query).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus !== 'PENDING') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Order cannot be cancelled because the kitchen has already started processing (${order.orderStatus}).`,
      });
    }

    const orderAgeMs = Date.now() - new Date(order.createdAt).getTime();
    const MAX_CANCEL_WINDOW_MS = 5 * 60 * 1000;

    if (orderAgeMs > MAX_CANCEL_WINDOW_MS) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: 'The 5-minute cancellation window has expired. Please contact kitchen support directly.',
      });
    }

    if (order.inventoryDepleted) {
      await restoreInventoryForOrder({
        orderItems: order.items,
        branchId: order.branch,
        orderNumber: order.orderNumber,
        userId: null,
        session,
      });
      order.inventoryDepleted = false;
    }

    order.orderStatus = 'CANCELLED';
    order.cancelledBy = 'CUSTOMER';
    order.cancellationReason = reason || 'Cancelled by customer within grace window.';
    order.paymentStatus = order.paymentStatus === 'PAID' ? 'REFUNDED' : 'VOID';

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Customer Cancel Error:', error);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};

// @desc    Delete/Purge order
// @route   DELETE /api/orders/:id
// @access  Private (orders:delete / Super Admin)
const deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.inventoryDepleted && order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED') {
      await restoreInventoryForOrder({
        orderItems: order.items,
        branchId: order.branch,
        orderNumber: order.orderNumber,
        userId: req.user?._id || null,
        session,
      });
    }

    await StockTransaction.deleteMany({
      notes: { $regex: order.orderNumber, $options: 'i' },
    }).session(session);

    await Order.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} permanently purged and associated inventory/transactions balanced.`,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete Order Error:', error);
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

module.exports = {
  createStripePaymentIntent,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelCustomerOrder,
  deleteOrder,
};