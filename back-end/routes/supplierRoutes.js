// back-end/routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/')
  .get(requirePermission(['suppliers:view', 'inventory:view'], true), getSuppliers)
  .post(requirePermission('suppliers:create'), createSupplier);

router.route('/:id')
  .put(requirePermission('suppliers:edit'), updateSupplier)
  .delete(requirePermission('suppliers:delete'), deleteSupplier);

module.exports = router;