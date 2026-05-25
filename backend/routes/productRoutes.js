const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/productUploadMiddleware');

const router = express.Router();

const productValidation = [
  body('name').notEmpty().withMessage('Product name is required').trim(),
  body('price').isNumeric().withMessage('Price must be numeric').custom(value => value > 0).withMessage('Price must be greater than 0'),
];

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize('admin'), upload.single('image'), productValidation, createProduct);
router.put('/:id', protect, authorize('admin'), upload.single('image'), productValidation, updateProduct);
router.patch('/:id/availability', protect, authorize('admin'), toggleProductAvailability);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
