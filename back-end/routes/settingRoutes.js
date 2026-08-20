// backend/src/routes/settingRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Multer fields handler for multiple logo keys
const logoUpload = upload.fields([
  { name: 'storeLogo', maxCount: 1 },
  { name: 'adminLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

// Public read: Storefront branding, metadata, and SEO tab title
router.get('/', getSettings);

// Protected update: Requires store settings modification permission
router.put(
  '/',
  protect,
  requirePermission('settings:edit'),
  logoUpload,
  updateSettings
);

module.exports = router;