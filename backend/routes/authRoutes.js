const express = require('express');
const { body } = require('express-validator');
const { getMe, updateProfile, requestOTP, verifyOTP, verifyPIN, login, logout, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/verify-pin', verifyPIN);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('image'), updateProfile);
router.delete('/profile', protect, deleteAccount);

module.exports = router;
