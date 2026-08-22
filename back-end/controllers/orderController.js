// back-end/controllers/orderController.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Branch = require('../models/Branch');
const {
  validateStockAvailability,
  depleteInventoryForOrder,
  restoreInventoryForOrder,
} = require('../services/inventoryDepletionService'); // Fixed exact file casing

// Safe Stripe initialization for free test mode
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// @desc    Create Stripe PaymentIntent for Card Checkout (Free Sandbox / Test Mode)
// @route   POST /api/orders/create-payment-intent
// @access  Public
const createStripePaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'pkr' } = req.body;

    if (!stripe) {
      // Mock client secret fallback if no secret key is set
      return res.status(200).json({
        clientSecret: `mock_pi_secret_${Date.now()}`,
        paymentIntentId: `pi_mock_${Date.now()}`,
        isMock: true,
      });
    }

    // Stripe processes smallest currency subunit (cents / paisa)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: { integration_check: 'burger_oclock_checkout' },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe Intent Error:', error);
    res.status(500).json({ message: 'Failed to initialize payment session', error: error.message });
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
      stripePaymentIntentId,
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

    // --- 🛡️ ROBUST BRANCH RESOLUTION ---
    let resolvedBranchId = null;

    if (typeof branch === 'string' && mongoose.Types.ObjectId.isValid(branch)) {
      resolvedBranchId = branch;
    } else if (branch?._id && mongoose.Types.ObjectId.isValid(branch._id)) {
      resolvedBranchId = branch._id;
    } else {
      // Find branch by name or custom id slug in database
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
        // Fallback to the first active branch in DB
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

    // 1. Guard Check: Pre-validate kitchen raw materials availability
    await validateStockAvailability({
      orderItems: items,
      branchId: resolvedBranchId, // ✅ Use resolvedBranchId
      session,
    });

    // 2. Generate clean tracking ID: BOC-YYYYMMDD-XXXX
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

    const isCardPaid = paymentMethod === 'CARD' || paymentMethod === 'ONLINE';

    const newOrder = new Order({
      orderNumber,
      customer,
      branch: resolvedBranchId, // ✅ Use resolvedBranchId
      orderType: orderType || 'DELIVERY',
      items: formattedItems,
      subtotal: Number(subtotal),
      tax: Number(tax) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isCardPaid ? 'PAID' : 'PENDING',
      stripePaymentIntentId: stripePaymentIntentId || null,
      orderStatus: 'PENDING',
      orderNotes: orderNotes || '',
      inventoryDepleted: true,
    });

    const savedOrder = await newOrder.save({ session });

    // 3. Atomically deplete raw materials via FEFO batch engine & yield formulas
    await depleteInventoryForOrder({
      orderItems: items,
      branchId: resolvedBranchId, // ✅ Use resolvedBranchId
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

// @desc    Update order status (handles kitchen cancellation inventory rollback)
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

    // If order is cancelled and inventory was previously depleted, restore stock
    if (orderStatus === 'CANCELLED' && previousStatus !== 'CANCELLED' && order.inventoryDepleted) {
      await restoreInventoryForOrder({
        orderItems: order.items,
        branchId: order.branch,
        orderNumber: order.orderNumber,
        userId: req.user?._id || null,
        session,
      });
      order.inventoryDepleted = false;
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
  createStripePaymentIntent,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
};