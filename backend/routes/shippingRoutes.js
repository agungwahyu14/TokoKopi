const express = require('express');
const router = express.Router();
const { getRates, handleWebhook, createShipment, getTracking } = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/rates', protect, getRates);
router.post('/webhook', handleWebhook);
router.post('/request-delivery/:orderId', protect, authorize('admin'), createShipment);
router.get('/tracking/:orderId', protect, getTracking);

module.exports = router;
