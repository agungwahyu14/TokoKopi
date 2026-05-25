const { CartItem, Product } = require('../models');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'imageUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: cartItems,
    });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data keranjang' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  const { productId, quantity, notes, options } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID wajib diisi' });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    // Check if item already exists in cart with same options
    let cartItem = await CartItem.findOne({
      where: {
        userId: req.user.id,
        productId,
        options: options || null, // Simplified check, might need better logic for complex JSON
      },
    });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
      if (notes) cartItem.notes = notes;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        userId: req.user.id,
        productId,
        quantity: quantity || 1,
        notes,
        options,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Berhasil ditambahkan ke keranjang',
      data: cartItem,
    });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan ke keranjang' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
exports.updateCartItem = async (req, res) => {
  const { quantity, notes } = req.body;
  const { id } = req.params;

  try {
    const cartItem = await CartItem.findOne({
      where: { id, userId: req.user.id },
    });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan di keranjang' });
    }

    if (quantity !== undefined) cartItem.quantity = quantity;
    if (notes !== undefined) cartItem.notes = notes;

    if (cartItem.quantity <= 0) {
      await cartItem.destroy();
      return res.status(200).json({ success: true, message: 'Item dihapus dari keranjang' });
    }

    await cartItem.save();

    return res.status(200).json({
      success: true,
      message: 'Keranjang diperbarui',
      data: cartItem,
    });
  } catch (error) {
    console.error('updateCartItem error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui keranjang' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = async (req, res) => {
  const { id } = req.params;

  try {
    const cartItem = await CartItem.findOne({
      where: { id, userId: req.user.id },
    });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan di keranjang' });
    }

    await cartItem.destroy();

    return res.status(200).json({
      success: true,
      message: 'Item berhasil dihapus',
    });
  } catch (error) {
    console.error('removeFromCart error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus item' });
  }
};

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    await CartItem.destroy({
      where: { userId: req.user.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Keranjang berhasil dikosongkan',
    });
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengosongkan keranjang' });
  }
};