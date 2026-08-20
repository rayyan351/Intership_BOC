// back-end/controllers/supplierController.js
const Supplier = require('../models/Supplier');

// @desc    Get all active suppliers
// @route   GET /api/suppliers
// @access  Private (suppliers:view)
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
  }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (suppliers:create)
const createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    const saved = await supplier.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating supplier', error: error.message });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (suppliers:edit)
const updateSupplier = async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
};

// @desc    Soft-delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (suppliers:delete)
const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ message: 'Supplier removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };