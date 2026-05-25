const express = require('express');
const { 
  getPromos, 
  getPromoById, 
  getLoyaltyPoints, 
  claimPromo, 
  getUserVouchers,
  createPromo, 
  updatePromo, 
  deletePromo,
  togglePromoStatus
} = require('../controllers/promoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/promoUploadMiddleware');
const router = express.Router();

router.get('/', getPromos);
router.get('/my-vouchers', protect, getUserVouchers);
router.get('/:id', getPromoById);
router.get('/loyalty/points', protect, getLoyaltyPoints);
router.post('/claim', protect, claimPromo);
router.post('/', protect, authorize('admin'), upload.single('image'), createPromo);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updatePromo);
router.patch('/:id/status', protect, authorize('admin'), togglePromoStatus);
router.delete('/:id', protect, authorize('admin'), deletePromo);

module.exports = router;