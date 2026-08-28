// controllers/productController.js
const Product = require('../models/Product');
const path = require('path');

// Helper to safely parse categories array from FormData/JSON
const parseCategories = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    return [input];
  }
};

const parseBoolean = (val, defaultValue = false) => {
  if (val === undefined || val === null) return defaultValue;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.toLowerCase() === 'true';
  return Boolean(val);
};

// GET all products
const getProducts = async (req, res) => {
  try {
    const { publicOnly } = req.query;
    const filter = {};

    if (publicOnly === 'true') {
      filter.isDealOnly = { $ne: true };
      filter.isShown = true;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
};

// POST create new product
const createProduct = async (req, res) => {
  try {
    const { name, categories, category, price, description, isShown, isDealOnly } = req.body;

    const isDealOnlyBool = parseBoolean(isDealOnly, false);
    const parsedPrice = Number(price);

    if (!isDealOnlyBool && (isNaN(parsedPrice) || parsedPrice <= 0)) {
      return res.status(400).json({
        message: 'Regular menu products must have a price greater than 0.',
      });
    }

    const generatedId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existingProduct = await Product.findOne({
      $or: [{ id: generatedId }, { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }]
    });

    if (existingProduct) {
      return res.status(400).json({
        message: 'An item with this name already exists.',
      });
    }

    // Save actual filename created by multer or relative path
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    }

    const finalCategories = parseCategories(categories || category);

    const newProduct = new Product({
      id: generatedId,
      name: name.trim(),
      categories: finalCategories,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      description,
      image: imagePath,
      isShown: parseBoolean(isShown, true),
      isDealOnly: isDealOnlyBool,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An item with this name already exists.' });
    }
    console.error('Server Error:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// PUT update product by MongoDB _id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categories, category, price, description, isShown, isDealOnly } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (isDealOnly !== undefined) {
      product.isDealOnly = parseBoolean(isDealOnly, false);
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!product.isDealOnly && parsedPrice <= 0) {
        return res.status(400).json({ message: 'Regular menu products must have a price greater than 0.' });
      }
      product.price = parsedPrice;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description;

    const rawCategoryInput = categories !== undefined ? categories : category;
    if (rawCategoryInput !== undefined) {
      product.categories = parseCategories(rawCategoryInput);
    }

    if (isShown !== undefined) {
      product.isShown = parseBoolean(isShown, true);
    }

    // Assign the actual multer disk filename
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Server Error on Update:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// DELETE product by MongoDB _id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Server Error on Delete:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };