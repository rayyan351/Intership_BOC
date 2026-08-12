const express = require('express');
const router = express.Router();
const { getDealCategories, createDealCategory } = require('../controllers/dealCategoryController');

router.get('/', getDealCategories);
router.post('/', createDealCategory);

module.exports = router;