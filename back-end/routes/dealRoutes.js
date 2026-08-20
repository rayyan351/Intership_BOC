// back-end/routes/dealRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getDeals, createDeal, updateDeal, deleteDeal } = require('../controllers/dealController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../assets/uploads/images/products'));
  },
  filename: (req, file, cb) => {
    const title = req.body.title || 'deal';
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    cb(null, `${slug}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Public read: Storefront listing & Admin overview
router.get('/', getDeals);

// Protected admin mutations
router.post(
  '/',
  protect,
  requirePermission('deals:create'),
  upload.single('image'),
  createDeal
);

router.put(
  '/:id',
  protect,
  requirePermission(['deals:edit', 'deals:status', 'deals:toggle_stock'], true),
  upload.single('image'),
  updateDeal
);

router.delete(
  '/:id',
  protect,
  requirePermission('deals:delete'),
  deleteDeal
);

module.exports = router;