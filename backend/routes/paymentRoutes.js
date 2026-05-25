const express = require('express');
const { createPayment, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/orders/:id/pay', protect, createPayment);
router.post('/notification', handleWebhook);

router.get('/payment/finish', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Pembayaran selesai' 
  });
});

module.exports = router;