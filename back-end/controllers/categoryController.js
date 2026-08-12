// back-end/controllers/categoryController.js
const Category = require('../models/Category');

// GET all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// POST create category
const createCategory = async (req, res) => {
  try {
    const { label, hasBanner, banner } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const categoryId = label.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existingCategory = await Category.findOne({
      $or: [{ id: categoryId }, { label: { $regex: new RegExp(`^${label.trim()}$`, 'i') } }]
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const categoryCount = await Category.countDocuments();

    const newCategory = new Category({
      id: categoryId,
      label: label.trim(),
      sourceName: label.trim(),
      order: categoryCount + 1,
      hasBanner: hasBanner ?? true,
      banner: banner || '/placeholder-banner.png',
      isShown: true,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// PUT update category by MongoDB _id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, isShown } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (label) {
      const newLabel = label.trim();
      const newSlug = newLabel.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

      category.label = newLabel;
      category.sourceName = newLabel;
      category.id = newSlug; // Keeps Category ID slug updated with label change
    }

    if (isShown !== undefined) {
      category.isShown = typeof isShown === 'string' ? isShown === 'true' : Boolean(isShown);
    }

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// DELETE category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };