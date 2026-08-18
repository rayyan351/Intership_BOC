// backend/src/routes/settingRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingController');

// Multer fields handler for multiple logo keys
const logoUpload = upload.fields([
  { name: 'storeLogo', maxCount: 1 },
  { name: 'adminLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
]);

router.get('/', getSettings);
router.put('/', logoUpload, updateSettings);

module.exports = router;