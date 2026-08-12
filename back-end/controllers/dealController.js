const Deal = require('../models/Deal');
const path = require('path');

// GET all deals with populated product details
const getDeals = async (req, res) => {
  try {
    const deals = await Deal.find({})
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 });
    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deals', error: error.message });
  }
};

// POST create deal
const createDeal = async (req, res) => {
  try {
    const { title, dealType, items, originalPrice, dealPrice, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Deal title is required' });
    }

    const generatedId = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existingDeal = await Deal.findOne({ id: generatedId });
    if (existingDeal) {
      return res.status(400).json({ message: 'A deal with this title already exists' });
    }

    let parsedItems = [];
    if (items) {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    }

    let imagePath = '/placeholder.png';
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      imagePath = `http://localhost:5000/uploads/images/products/${generatedId}${ext}`;
    }

    const newDeal = new Deal({
      id: generatedId,
      title: title.trim(),
      dealType: dealType || 'Combo Deals',
      items: parsedItems,
      originalPrice: Number(originalPrice),
      dealPrice: Number(dealPrice),
      description,
      image: imagePath,
      isShown: true,
    });

    const savedDeal = await newDeal.save();
    const populatedDeal = await Deal.findById(savedDeal._id).populate('items.product', 'name price image');
    res.status(201).json(populatedDeal);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ message: 'Error creating deal', error: error.message });
  }
};

// PUT update deal
const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, dealType, items, originalPrice, dealPrice, description, isShown } = req.body;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (title) {
      deal.title = title.trim();
      deal.id = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    if (dealType) deal.dealType = dealType;
    if (items !== undefined) {
      deal.items = typeof items === 'string' ? JSON.parse(items) : items;
    }
    if (originalPrice) deal.originalPrice = Number(originalPrice);
    if (dealPrice) deal.dealPrice = Number(dealPrice);
    if (description !== undefined) deal.description = description;

    if (isShown !== undefined) {
      deal.isShown = typeof isShown === 'string' ? isShown === 'true' : Boolean(isShown);
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname);
      deal.image = `http://localhost:5000/uploads/images/products/${deal.id}${ext}`;
    }

    const updatedDeal = await deal.save();
    const populatedDeal = await Deal.findById(updatedDeal._id).populate('items.product', 'name price image');
    res.status(200).json(populatedDeal);
  } catch (error) {
    res.status(500).json({ message: 'Error updating deal', error: error.message });
  }
};

// DELETE deal
const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    await Deal.findByIdAndDelete(id);
    res.status(200).json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting deal', error: error.message });
  }
};

module.exports = { getDeals, createDeal, updateDeal, deleteDeal };