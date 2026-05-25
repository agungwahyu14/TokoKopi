const { validationResult } = require('express-validator');
const { Product, Category } = require('../models');
const path = require('path');
const fs = require('fs');

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      include: [{ model: Category, as: 'categories' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const response = {
      success: true,
      data: products,
      meta: {
        total: count,
        totalPages: Math.ceil(count / limit),
        page
      }
    };
    console.log('getProducts response:', JSON.stringify(response, null, 2));
    return res.status(200).json(response);
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'categories' }]
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const response = { success: true, data: product };
    console.log('getProductById response:', JSON.stringify(response, null, 2));
    return res.status(200).json(response);
  } catch (error) {
    console.error('getProductById error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { categoryId, name, description, price, isAvailable } = req.body;
    
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      isAvailable: isAvailable === 'true' || isAvailable === true,
      imageUrl
    });

    if (categoryId) {
      await product.setCategories([categoryId]);
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { categoryId, name, description, price, isAvailable } = req.body;
    
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      // Delete old image if it exists and is local
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/products/')) {
        const oldPath = path.join(__dirname, '..', product.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    await product.update({
      name,
      description,
      price: price ? parseFloat(price) : product.price,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : product.isAvailable,
      imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl
    });

    if (categoryId) {
      await product.setCategories([categoryId]);
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleProductAvailability = async (req, res) => {
  const { isAvailable } = req.body;

  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (isAvailable !== undefined) {
      product.isAvailable = Boolean(isAvailable);
    } else {
      // Toggle logic if no value provided
      product.isAvailable = !product.isAvailable;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product availability updated',
      data: product,
    });
  } catch (error) {
    console.error('toggleProductAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete image if it exists and is local
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/products/')) {
      const imgPath = path.join(__dirname, '..', product.imageUrl);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
};
