const { Rating, Order } = require('../models');

const createRating = async (req, res) => {
  try {
    const { orderId, stars, comment } = req.body;
    const userId = req.user.id;

    // 1. Validasi pesanan
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    // 2. Pastikan pesanan milik user ini dan sudah selesai
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Anda tidak berwenang memberikan rating untuk pesanan ini' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Rating hanya bisa diberikan untuk pesanan yang sudah selesai' });
    }

    // 3. Cek apakah sudah pernah memberi rating
    const existingRating = await Rating.findOne({ where: { orderId } });
    if (existingRating) {
      return res.status(400).json({ success: false, message: 'Anda sudah memberikan rating untuk pesanan ini' });
    }

    // 4. Simpan rating
    const rating = await Rating.create({
      orderId,
      userId,
      stars,
      comment
    });

    return res.status(201).json({
      success: true,
      message: 'Terima kasih atas ulasan Anda!',
      data: rating
    });

  } catch (error) {
    console.error('createRating error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan rating' });
  }
};

const getRatings = async (req, res) => {
  try {
    const ratings = await Rating.findAll({
      include: [
        { model: Order, as: 'order', attributes: ['orderNumber'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: ratings
    });
  } catch (error) {
    console.error('getRatings error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil ulasan' });
  }
};

module.exports = { createRating, getRatings };
