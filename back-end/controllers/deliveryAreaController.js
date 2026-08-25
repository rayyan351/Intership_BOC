// back-end/controllers/deliveryAreaController.js
const DeliveryArea = require('../models/DeliveryArea');
const SystemSetting = require('../models/SystemSetting');
const { resolveOptimalBranchAndETA } = require('../utils/branchRoutingEngine');

// @desc    Get all delivery areas with automated branch assignment & live dynamic ETA
// @route   GET /api/delivery-areas
// @access  Public
const getDeliveryAreas = async (req, res) => {
  try {
    const { city, activeOnly } = req.query;
    const filter = {};

    if (city) filter.city = { $regex: new RegExp(`^${city}$`, 'i') };
    if (activeOnly === 'true') filter.isActive = true;

    const areas = await DeliveryArea.find(filter)
      .populate('assignedBranch', 'name city branchCode address phone isShown')
      .sort({ city: 1, name: 1 })
      .lean();

    // Dynamically calculate live ETA and verify optimal kitchen assignment for each zone
    const dynamicAreas = await Promise.all(
      areas.map(async (area) => {
        const { branch, dynamicETA, activeQueueCount } = await resolveOptimalBranchAndETA({
          city: area.city,
          areaLat: area.latitude,
          areaLon: area.longitude,
          baseTransitMinutes: area.estimatedDeliveryMinutes || 35,
        });

        return {
          ...area,
          assignedBranch: area.assignedBranch || branch,
          dynamicETA,
          activeKitchenQueue: activeQueueCount,
        };
      })
    );

    res.status(200).json(dynamicAreas);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery areas', error: error.message });
  }
};

// @desc    Create new delivery area (Auto-assigns nearest branch automatically)
// @route   POST /api/delivery-areas
// @access  Private (Admin)
const createDeliveryArea = async (req, res) => {
  try {
    const { name, city, deliveryFee, estimatedDeliveryMinutes, latitude, longitude, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Area / Neighborhood name is required.' });
    }

    const targetCity = city || 'Karachi';

    // Auto-resolve nearest branch for this city/coordinates
    const { branch } = await resolveOptimalBranchAndETA({
      city: targetCity,
      areaLat: latitude || null,
      areaLon: longitude || null,
      baseTransitMinutes: estimatedDeliveryMinutes || 35,
    });

    const area = new DeliveryArea({
      name,
      city: targetCity,
      assignedBranch: branch?._id || null,
      latitude: latitude || null,
      longitude: longitude || null,
      deliveryFee: Number(deliveryFee) || 0,
      estimatedDeliveryMinutes: Number(estimatedDeliveryMinutes) || 35,
      isActive: isActive !== undefined ? isActive : true,
    });

    const saved = await area.save();
    const populated = await DeliveryArea.findById(saved._id).populate('assignedBranch', 'name city branchCode');
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
    const updateData = { ...req.body };

    // If city or coordinates changed, re-evaluate the optimal branch
    if (updateData.city || updateData.latitude || updateData.longitude) {
      const { branch } = await resolveOptimalBranchAndETA({
        city: updateData.city || 'Karachi',
        areaLat: updateData.latitude || null,
        areaLon: updateData.longitude || null,
        baseTransitMinutes: updateData.estimatedDeliveryMinutes || 35,
      });
      if (branch) {
        updateData.assignedBranch = branch._id;
      }
    }

    const updated = await DeliveryArea.findByIdAndUpdate(id, updateData, { new: true })
      .populate('assignedBranch', 'name city branchCode');

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