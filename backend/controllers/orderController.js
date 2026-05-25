const { validationResult } = require('express-validator');
const { Order, OrderItem, Product, User, Store, Promo, CartItem, UserPromo, Rating, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');

const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { items, notes, orderType, paymentMethod } = req.body;
  const userId = req.user.id;

  // Use a transaction
  const transaction = await sequelize.transaction();

  try {
    let totalAmount = 0;
    const orderItemsData = [];

    // Validation and processing
    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Product with id '${item.productId}' not found`,
        });
      }

      if (!product.isAvailable || product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Product '${product.name}' is unavailable or insufficient stock. Available: ${product.stock}`,
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: subtotal,
      });

      // Deduct stock
      await product.update({ stock: product.stock - item.quantity }, { transaction });
    }

    // Cost Breakdown
    const tax = totalAmount * 0.1; // 10% tax example
    const discount = 0; // logic for discount if any
    const finalTotal = totalAmount + tax - discount;

    // Create Order
    const orderNumber = `JKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = await Order.create({
      userId,
      orderNumber,
      totalAmount: finalTotal,
      finalAmount: finalTotal,
      subtotal: totalAmount,
      tax,
      discount,
      notes,
      orderType: orderType || 'dine-in',
      paymentMethod: paymentMethod || 'cash',
      status: 'pending'
    }, { transaction });

    // Link items to order
    for (const itemData of orderItemsData) {
      itemData.orderId = order.id;
    }

    // Create Order Items
    await OrderItem.bulkCreate(orderItemsData, { transaction });

    await transaction.commit();

    // Fetch the created order with associations
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: createdOrder,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    let whereCondition = {};
    
    // Customer sees their own orders, admin sees all
    if (req.user.role === 'customer') {
      whereCondition.userId = req.user.id;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { '$user.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereCondition,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Store, as: 'store', attributes: ['id', 'name', 'city'] },
        { model: Promo, as: 'promo', attributes: ['id', 'code', 'title'] },
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'imageUrl'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false
    });

    return res.status(200).json({
      success: true,
      data: orders,
      meta: {
        total: count,
        totalPages: Math.ceil(count / limit),
        page
      }
    });
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Store, as: 'store' },
        { model: Promo, as: 'promo', attributes: ['id', 'code', 'title', 'type', 'value'] },
        { model: Rating, as: 'rating' },
        { 
          model: OrderItem, 
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security check: Only admin or the order owner can view it
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { status } = req.body;

  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status === 'completed' && order.status !== 'completed') {
      const pointsToEarn = Math.floor(order.finalAmount / 1000);
      if (pointsToEarn > 0) {
        const user = await User.findByPk(order.userId);
        if (user) {
          await user.update({ points: (user.points || 0) + pointsToEarn });
          console.log(`✅ User ${user.id} earned ${pointsToEarn} points from order ${order.id}`);
        }
      }
    }

    await order.update({ status });

    // ✅ Kirim notifikasi otomatis ke mobile user (DB + Push Notification)
    try {
      const { sendOrderStatusNotification } = require('../utils/orderNotification');
      await sendOrderStatusNotification(order);
    } catch (notifErr) {
      console.error('[Notification Error in updateOrderStatus]', notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const checkout = async (req, res) => {
  const { 
    storeId, 
    notes, 
    orderType, 
    paymentMethod, 
    promoCode, 
    shippingCost = 0,
    deliveryAddress,
    deliveryLatitude,
    deliveryLongitude,
    receiverName,
    receiverPhone,
    courierCode,
    courierService
  } = req.body;
  const userId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    // 1. Get cart items
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{ model: Product, as: 'product' }],
      transaction
    });

    if (!cartItems || cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Keranjang belanja kosong' });
    }

    let subtotal = 0;
    const orderItemsData = [];

    // 2. Validate stock and calculate total
    for (const cartItem of cartItems) {
      const product = cartItem.product;

      if (!product || !product.isAvailable || product.stock < cartItem.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Produk '${product ? product.name : 'Unknown'}' tidak tersedia atau stok tidak mencukupi.`
        });
      }

      const itemSubtotal = product.price * cartItem.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: product.id,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        options: cartItem.options,
        notes: cartItem.notes
      });

      // Deduct stock
      await product.update({ stock: product.stock - cartItem.quantity }, { transaction });
    }

    // 3. Handle Promo
    let discount = 0;
    let appliedPromoId = null;
    if (promoCode) {
      const now = new Date();
      const promo = await Promo.findOne({ 
        where: { 
          code: promoCode, 
          isActive: true,
          [Op.and]: [
            {
              [Op.or]: [
                { startDate: null },
                { startDate: { [Op.lte]: now } }
              ]
            },
            {
              [Op.or]: [
                { endDate: null },
                { endDate: { [Op.gte]: now } }
              ]
            }
          ]
        }, 
        transaction 
      });
      if (promo) {
        appliedPromoId = promo.id;

        // Cek apakah user memiliki voucher ini (UserPromo) yang belum terpakai
        const userVoucher = await UserPromo.findOne({ 
          where: { userId, promoId: promo.id, isUsed: false },
          transaction
        });

        if (!userVoucher) {
          await transaction.rollback();
          return res.status(400).json({ 
            success: false, 
            message: 'Voucher tidak ditemukan di koleksi Anda. Silakan klaim voucher terlebih dahulu.' 
          });
        }

        // Tandai voucher sebagai terpakai
        await userVoucher.update({ isUsed: true, usedAt: new Date() }, { transaction });

        // Validasi Minimal Belanja
        if (subtotal < promo.minSpend) {
          await transaction.rollback();
          return res.status(400).json({ 
            success: false, 
            message: `Minimal belanja untuk menggunakan promo ini adalah Rp ${Math.round(promo.minSpend).toLocaleString('id-ID')}` 
          });
        }

        // Hitung Diskon
        if (promo.type === 'percent') {
          discount = (subtotal * promo.value) / 100;
          // Batasi dengan Maksimal Diskon jika ada
          if (promo.maxDiscount && discount > promo.maxDiscount) {
            discount = promo.maxDiscount;
          }
        } else {
          discount = promo.value;
        }
      }
    }

    // 4. Cost Breakdown
    const tax = (subtotal - discount) * 0.1; // 10% tax after discount
    const finalTotal = subtotal - discount + tax + parseFloat(shippingCost);

    // 5. Create Order
    const orderNumber = `JKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = await Order.create({
      userId,
      orderNumber,
      storeId: storeId || 1,
      promoId: appliedPromoId,
      totalAmount: finalTotal,
      finalAmount: finalTotal,
      subtotal,
      tax,
      discount,
      shippingCost: shippingCost || 0,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      receiverName,
      receiverPhone,
      courierCode,
      courierService,
      notes,
      orderType: orderType || 'pickup',
      paymentMethod: paymentMethod || 'midtrans',
      status: 'pending'
    }, { transaction });

    // 5. Create Order Items
    const finalItems = orderItemsData.map(item => ({ ...item, orderId: order.id }));
    await OrderItem.bulkCreate(finalItems, { transaction });

    // 6. Clear Cart
    await CartItem.destroy({ where: { userId }, transaction });

    await transaction.commit();

    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Store, as: 'store' }
      ]
    });

    // ✅ Kirim notifikasi "Menunggu Pembayaran"
    try {
      const { sendOrderStatusNotification } = require('../utils/orderNotification');
      await sendOrderStatusNotification(order);
    } catch (notifErr) {
      console.error('[Notification Error in checkout]', notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      data: completeOrder
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('checkout error:', error);
    return res.status(500).json({ success: false, message: 'Gagal melakukan checkout' });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, checkout };
