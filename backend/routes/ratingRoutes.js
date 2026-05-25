const express = require('express');
const router = express.Router();
const { createRating, getRatings } = require('../controllers/ratingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, createRating);
router.get('/', protect, authorize('admin'), getRatings);

module.exports = router;
