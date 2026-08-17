const express = require('express');
const router = express.Router();
const {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} = require('../controllers/sectionController');

// Import your existing multer upload middleware (adjust the path to wherever your upload middleware lives)
const upload = require('../middleware/uploadMiddleware') || require('../utils/multer');

router.get('/', getSections);
router.post('/', upload.single('banner'), createSection);
router.put('/:id', upload.single('banner'), updateSection);
router.delete('/:id', deleteSection);

module.exports = router;