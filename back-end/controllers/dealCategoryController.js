const DealCategory = require('../models/DealCategory');

const getDealCategories = async (req, res) => {
  try {
    const categories = await DealCategory.find({}).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching deal categories', error: error.message });
  }
};

const createDealCategory = async (req, res) => {
  try {
    const { label } = req.body;
    if (!label || !label.trim()) return res.status(400).json({ message: 'Category label is required' });

    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const newCategory = new DealCategory({ id, label: label.trim() });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating deal category', error: error.message });
  }
};

module.exports = { getDealCategories, createDealCategory };