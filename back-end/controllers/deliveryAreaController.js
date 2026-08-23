// back-end/controllers/deliveryAreaController.js
const DeliveryArea = require('../models/DeliveryArea');
const SystemSetting = require('../models/SystemSetting');

// @desc    Get all active delivery areas (Public for storefront & Admin)
// @route   GET /api/delivery-areas
// @access  Public
const getDeliveryAreas = async (req, res) => {
  try {
    const { city, branchId, activeOnly } = req.query;
    const filter = {};

    if (city) filter.city = city;
    if (branchId) filter.assignedBranch = branchId;
    if (activeOnly === 'true') filter.isActive = true;

    const areas = await DeliveryArea.find(filter)
      .populate('assignedBranch', 'name city branchCode address phone isActive')
      .sort({ city: 1, name: 1 });

    res.status(200).json(areas);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery areas', error: error.message });
  }
};

// @desc    Create new delivery area
// @route   POST /api/delivery-areas
// @access  Private (Admin)
const createDeliveryArea = async (req, res) => {
  try {
    const { name, city, assignedBranch, deliveryFee, estimatedDeliveryMinutes, isActive } = req.body;

    if (!name || !assignedBranch) {
      return res.status(400).json({ message: 'Area name and assigned branch are required.' });
    }

    const area = new DeliveryArea({
      name,
      city: city || 'Karachi',
      assignedBranch,
      deliveryFee: Number(deliveryFee) || 0,
      estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes) || 35,
      isActive: isActive !== undefined ? isActive : true,
    });

    const saved = await area.save();
    const populated = await DeliveryArea.findById(saved._id).populate('assignedBranch', 'name city');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error creating delivery area', error: error.message });
  }
};

// @desc    Update delivery area
// @route   PUT /api/delivery-areas/:id
// @access  Private (Admin)
const updateDeliveryArea = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await DeliveryArea.findByIdAndUpdate(id, req.body, { new: true })
      .populate('assignedBranch', 'name city');

    if (!updated) return res.status(404).json({ message: 'Delivery area not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery area', error: error.message });
  }
};

// @desc    Delete delivery area
// @route   DELETE /api/delivery-areas/:id
// @access  Private (Admin)
const deleteDeliveryArea = async (req, res) => {
  try {
    const { id } = req.params;
    await DeliveryArea.findByIdAndDelete(id);
    res.status(200).json({ message: 'Delivery area deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting delivery area', error: error.message });
  }
};

// @desc    Get Global Restaurant Tax & Delivery Config
// @route   GET /api/delivery-areas/settings
// @access  Public
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'GLOBAL_RESTAURANT_CONFIG' });
    if (!settings) {
      settings = new SystemSetting({ key: 'GLOBAL_RESTAURANT_CONFIG' });
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system settings', error: error.message });
  }
};

// @desc    Update Tax Config (Admin custom SST/GST rates)
// @route   PUT /api/delivery-areas/settings
// @access  Private (Admin)
const updateSystemSettings = async (req, res) => {
  try {
    const { taxSettings } = req.body;
    let settings = await SystemSetting.findOne({ key: 'GLOBAL_RESTAURANT_CONFIG' });
    if (!settings) settings = new SystemSetting({ key: 'GLOBAL_RESTAURANT_CONFIG' });

    if (taxSettings) {
      settings.taxSettings = {
        ...settings.taxSettings.toObject(),
        ...taxSettings,
      };
    }

    const saved = await settings.save();
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error updating system settings', error: error.message });
  }
};

module.exports = {
  getDeliveryAreas,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea,
  getSystemSettings,
  updateSystemSettings,
};