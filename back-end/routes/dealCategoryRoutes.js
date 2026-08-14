const express = require('express');
const router = express.Router();
const {
  getDealCategories,
  createDealCategory,
  updateDealCategory,
  deleteDealCategory,
} = require('../controllers/dealCategoryController');

router.route('/').get(getDealCategories).post(createDealCategory);
router.route('/:id').put(updateDealCategory).delete(deleteDealCategory);

module.exports = router;