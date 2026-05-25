const express = require('express');
const { getSalesReport, getProductReport, getCustomerReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sales', protect, authorize('admin'), getSalesReport);
router.get('/products', protect, authorize('admin'), getProductReport);
router.get('/customers', protect, authorize('admin'), getCustomerReport);

module.exports = router;
