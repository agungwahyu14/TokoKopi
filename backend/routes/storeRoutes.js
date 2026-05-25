const express = require('express');
const { getStores, getNearbyStores, getStoreById, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getStores);
router.get('/nearby', getNearbyStores);
router.get('/:id', getStoreById);
router.post('/', protect, authorize('admin'), createStore);
router.put('/:id', protect, authorize('admin'), updateStore);
router.delete('/:id', protect, authorize('admin'), deleteStore);

module.exports = router;