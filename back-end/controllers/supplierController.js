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
    const { name, phone, email, contactPerson, address, taxNumber, paymentTerms } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Supplier name and phone number are required.' });
    }

    const cleanPrefix = name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') || 'SUP';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `SUP-${cleanPrefix}-${randomSuffix}`;

    const supplier = new Supplier({
      name: name.trim(),
      phone: phone.trim(),
      supplierCode: generatedCode,
      contactPerson: contactPerson ? contactPerson.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      address: address ? address.trim() : '',
      taxNumber: taxNumber ? taxNumber.trim() : '',
      paymentTerms: paymentTerms || 'COD',
    });

    const saved = await supplier.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('SERVER ERROR [createSupplier]:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A supplier with this code already exists.', error: error.message });
    }
    res.status(500).json({ message: error.message || 'Error creating supplier' });
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (suppliers:edit)
const updateSupplier = async (req, res) => {
  try {
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Supplier not found' });
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