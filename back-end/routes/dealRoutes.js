const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getDeals, createDeal, updateDeal, deleteDeal } = require('../controllers/dealController');

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

router.get('/', getDeals);
router.post('/', upload.single('image'), createDeal);
router.put('/:id', upload.single('image'), updateDeal);
router.delete('/:id', deleteDeal);

module.exports = router;