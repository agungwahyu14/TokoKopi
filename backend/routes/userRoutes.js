const express = require('express');
const { getUsers, updateUserPoints } = require('../controllers/userController');
const { getAddresses, addAddress, deleteAddress } = require('../controllers/addressController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin'), getUsers);
router.patch('/:id/points', protect, authorize('admin'), updateUserPoints);
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;
