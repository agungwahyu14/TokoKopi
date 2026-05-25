const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  checkout
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.productId').isInt().withMessage('Each item must have a productId as integer'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
];

const updateStatusValidation = [
  body('status')
    .notEmpty()
    .isIn(['pending', 'pending_payment', 'confirmed', 'processing', 'ready_for_pickup', 'on_delivery', 'completed', 'cancelled'])
    .withMessage('Invalid order status'),
];

router.post('/checkout', protect, checkout);
router.post('/', protect, createOrderValidation, createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, authorize('admin'), updateStatusValidation, updateOrderStatus);
router.put('/:id/status', protect, authorize('admin'), updateStatusValidation, updateOrderStatus);

module.exports = router;
