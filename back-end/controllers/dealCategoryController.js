const DealCategory = require('../models/DealCategory');

// @desc    Get all deal categories
// @route   GET /api/deal-categories
const getDealCategories = async (req, res) => {
  try {
    const categories = await DealCategory.find({}).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deal categories', error: error.message });
  }
};

// @desc    Create new deal category
// @route   POST /api/deal-categories
const createDealCategory = async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Category label is required' });
    }

    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const exists = await DealCategory.findOne({ id });
    if (exists) {
      return res.status(400).json({ message: 'Deal category already exists' });
    }

    const newCategory = new DealCategory({ id, label: label.trim(), isShown: true });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating deal category', error: error.message });
  }
};

// @desc    Update deal category
// @route   PUT /api/deal-categories/:id
const updateDealCategory = async (req, res) => {
  try {
    const { label, isShown } = req.body;
    const category = await DealCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Deal category not found' });
    }

    if (label !== undefined) category.label = label.trim();
    if (isShown !== undefined) category.isShown = isShown;

    const updated = await category.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating deal category', error: error.message });
  }
};

// @desc    Delete deal category
// @route   DELETE /api/deal-categories/:id
const deleteDealCategory = async (req, res) => {
  try {
    const category = await DealCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Deal category not found' });
    }
    await category.deleteOne();
    res.status(200).json({ message: 'Deal category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting deal category', error: error.message });
  }
};

module.exports = {
  getDealCategories,
  createDealCategory,
  updateDealCategory,
  deleteDealCategory,
};