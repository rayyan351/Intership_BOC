// back-end/routes/sectionRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} = require('../controllers/sectionController');

const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// Public read: Homepage storefront display & Admin curation
router.get('/', getSections);

// Protected admin mutations
router.post(
  '/',
  protect,
  requirePermission('sections:create'),
  upload.single('banner'),
  createSection
);

router.put(
  '/:id',
  protect,
  requirePermission(['sections:edit', 'sections:status', 'sections:toggle_stock'], true),
  upload.single('banner'),
  updateSection
);

router.delete(
  '/:id',
  protect,
  requirePermission('sections:delete'),
  deleteSection
);

module.exports = router;