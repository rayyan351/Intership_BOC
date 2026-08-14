// back-end/controllers/dealController.js
const Deal = require('../models/Deal');
const path = require('path');

// GET all deals
const getDeals = async (req, res) => {
  try {
    const deals = await Deal.find({})
      .populate('fixedItems.product', 'name price image categories')
      .populate('choiceGroups.options.product', 'name price image categories')
      .sort({ createdAt: -1 });

    res.status(200).json(deals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deals', error: error.message });
  }
};

// POST create deal
const createDeal = async (req, res) => {
  try {
    const {
      title,
      dealType,
      originalPrice,
      dealPrice,
      description,
      fixedItems,
      choiceGroups,
      isShown,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Deal title is required' });
    }

    let generatedId = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingDeal = await Deal.findOne({ id: generatedId });
    if (existingDeal) {
      generatedId = `${generatedId}-${Date.now()}`;
    }

    const parsedFixedItems = fixedItems ? JSON.parse(fixedItems) : [];
    const parsedChoiceGroups = choiceGroups ? JSON.parse(choiceGroups) : [];

    let imagePath = '/placeholder.png';
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      imagePath = `http://localhost:5000/uploads/images/products/${generatedId}${ext}`;
    }

    const newDeal = new Deal({
      id: generatedId,
      title: title.trim(),
      dealType: dealType || 'Combo Deals',
      fixedItems: parsedFixedItems,
      choiceGroups: parsedChoiceGroups,
      originalPrice: Number(originalPrice) || 0,
      dealPrice: Number(dealPrice) || 0,
      description: description || '',
      image: imagePath,
      isShown: isShown !== undefined ? (typeof isShown === 'string' ? isShown === 'true' : Boolean(isShown)) : true,
    });

    const savedDeal = await newDeal.save();
    const populatedDeal = await Deal.findById(savedDeal._id)
      .populate('fixedItems.product', 'name price image categories')
      .populate('choiceGroups.options.product', 'name price image categories');

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
    const {
      title,
      dealType,
      fixedItems,
      choiceGroups,
      originalPrice,
      dealPrice,
      description,
      isShown,
    } = req.body;

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    if (title) {
      deal.title = title.trim();
      deal.id = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (dealType) deal.dealType = dealType;

    if (fixedItems !== undefined) {
      deal.fixedItems = typeof fixedItems === 'string' ? JSON.parse(fixedItems) : fixedItems;
    }

    if (choiceGroups !== undefined) {
      deal.choiceGroups = typeof choiceGroups === 'string' ? JSON.parse(choiceGroups) : choiceGroups;
    }

    if (originalPrice !== undefined) deal.originalPrice = Number(originalPrice);
    if (dealPrice !== undefined) deal.dealPrice = Number(dealPrice);
    if (description !== undefined) deal.description = description;

    if (isShown !== undefined) {
      deal.isShown = typeof isShown === 'string' ? isShown === 'true' : Boolean(isShown);
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname);
      deal.image = `http://localhost:5000/uploads/images/products/${deal.id}${ext}`;
    }

    const updatedDeal = await deal.save();
    const populatedDeal = await Deal.findById(updatedDeal._id)
      .populate('fixedItems.product', 'name price image categories')
      .populate('choiceGroups.options.product', 'name price image categories');

    res.status(200).json(populatedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
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