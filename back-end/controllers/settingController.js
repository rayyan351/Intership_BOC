const Setting = require('../models/Setting');

// Helper to resolve uploaded image file URL
const getUploadedFileUrl = (req, fieldname) => {
  if (!req.files || !req.files[fieldname]) return null;
  const file = req.files[fieldname][0];
  return `http://localhost:5000/uploads/settings/${file.filename}`;
};

// GET global settings (creates default if none exists)
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        storeName: "Burger O'Clock",
        storeLogo: "",
        adminLogo: "",
      });
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

const triggerNextRevalidation = async () => {
  try {
    const storefrontUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await fetch(`${storefrontUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/',
        tag: 'settings',
        secret: process.env.REVALIDATION_SECRET || 'my_super_secret_token_123',
      }),
    });
  } catch (err) {
    console.error('ISR Revalidation Error:', err.message);
  }
};

// PUT / POST update global settings
const updateSettings = async (req, res) => {
  try {
    const {
      storeName,
      siteTitle,
      removeStoreLogo,
      removeAdminLogo,
      removeFavicon,
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (storeName) settings.storeName = storeName.trim();
    if (siteTitle !== undefined) settings.siteTitle = siteTitle.trim();

    // Store Logo
    if (String(removeStoreLogo) === 'true') {
      settings.storeLogo = '';
    } else {
      const uploadedStoreLogo = getUploadedFileUrl(req, 'storeLogo');
      if (uploadedStoreLogo) settings.storeLogo = uploadedStoreLogo;
    }

    // Admin Logo
    if (String(removeAdminLogo) === 'true') {
      settings.adminLogo = '';
    } else {
      const uploadedAdminLogo = getUploadedFileUrl(req, 'adminLogo');
      if (uploadedAdminLogo) settings.adminLogo = uploadedAdminLogo;
    }

    // Favicon
    if (String(removeFavicon) === 'true') {
      settings.favicon = '';
    } else {
      const uploadedFavicon = getUploadedFileUrl(req, 'favicon');
      if (uploadedFavicon) settings.favicon = uploadedFavicon;
    }

    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

module.exports = { getSettings, updateSettings };