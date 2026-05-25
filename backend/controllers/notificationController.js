const { Notification, User } = require('../models');
const { Op } = require('sequelize');
const { sendExpoPushNotifications } = require('../utils/pushNotification');

// ===================== ADMIN =====================

/**
 * [ADMIN] Kirim notifikasi ke user tertentu atau semua user
 * POST /api/notifications/send
 */
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', targetAll = false } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title dan message wajib diisi.' });
    }

    // Ambil path gambar dari file upload (multer) jika ada
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/notifications/${req.file.filename}`;
    }

    const isTargetAll = targetAll === true || targetAll === 'true';

    if (isTargetAll) {
      // Kirim ke semua user customer
      const users = await User.findAll({
        where: { role: 'customer' },
        attributes: ['id', 'expoPushToken', 'notifyPromo'],
      });

      if (users.length === 0) {
        return res.status(200).json({ success: true, message: 'Tidak ada user customer ditemukan.', count: 0 });
      }

      // Simpan ke database SATU PER SATU untuk mendapatkan ID masing-masing
      const createdNotifications = await Promise.all(
        users.map(u => Notification.create({
          userId: u.id,
          title,
          message,
          type,
          imageUrl,
          targetAll: true,
          isRead: false,
        }))
      );

      // Kirim push notification dengan notificationId yang benar per user
      // agar saat di-tap langsung buka detail notifikasi miliknya
      const pushPayloads = createdNotifications
        .map((notif, idx) => {
          const user = users[idx];
          if (user.notifyPromo === false) {
            return null; // Skip jika user unchecklist promo
          }
          return {
            token: user.expoPushToken,
            notificationId: notif.id,
          };
        })
        .filter(p => p !== null && !!p.token);

      if (pushPayloads.length > 0) {
        // Kirim satu per satu agar data.notificationId unik per user
        await Promise.all(
          pushPayloads.map(p =>
            sendExpoPushNotifications(p.token, title, message, {
              type,
              notificationId: p.notificationId,
              screen: 'notifications',
            })
          )
        );
      }

      return res.status(201).json({
        success: true,
        message: `Notifikasi berhasil dikirim ke ${users.length} user (${pushPayloads.length} push terkirim).`,
        count: users.length,
      });
    } else {
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId wajib jika tidak targetAll.' });
      }

      // Ambil data user (termasuk push token dan preferensi promo)
      const targetUser = await User.findByPk(Number(userId), { attributes: ['id', 'expoPushToken', 'notifyPromo'] });
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      const notif = await Notification.create({
        userId: Number(userId),
        title,
        message,
        type,
        imageUrl,
        targetAll: false,
        isRead: false,
      });

      // Kirim push notification ke 1 user jika diizinkan
      if (targetUser.expoPushToken) {
        if (targetUser.notifyPromo === false) {
          console.log(`[PromoNotif] User ${userId} menonaktifkan notifikasi promo. Push ditangguhkan.`);
        } else {
          await sendExpoPushNotifications(targetUser.expoPushToken, title, message, {
            type,
            notificationId: notif.id,
            screen: 'notifications',
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Notifikasi berhasil dikirim.',
        data: notif,
      });
    }
  } catch (error) {
    console.error('[sendNotification Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [ADMIN] Ambil semua notifikasi (untuk dashboard)
 * GET /api/notifications/admin/all
 */
exports.getAllNotificationsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('[getAllNotificationsAdmin Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [ADMIN] Hapus notifikasi
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByPk(id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
    await notif.destroy();
    return res.json({ success: true, message: 'Notifikasi dihapus.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===================== MOBILE (USER) =====================

/**
 * [USER] Simpan atau perbarui Expo Push Token perangkat
 * POST /api/notifications/register-token
 */
exports.savePushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const userId = req.user.id;

    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'expoPushToken wajib diisi.' });
    }

    await User.update({ expoPushToken }, { where: { id: userId } });

    console.log(`[PushToken] User ${userId} token disimpan: ${expoPushToken.substring(0, 30)}...`);
    return res.json({ success: true, message: 'Push token berhasil disimpan.' });
  } catch (error) {
    console.error('[savePushToken Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [USER] Ambil semua notifikasi milik user yang login
 * GET /api/notifications
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('[getMyNotifications Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [USER] Hitung notifikasi yang belum dibaca
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.count({
      where: { userId, isRead: false },
    });
    return res.json({ success: true, data: { count } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [USER] Tandai 1 notifikasi sebagai sudah dibaca
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await Notification.findOne({ where: { id, userId } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });

    await notif.update({ isRead: true, readAt: new Date() });
    return res.json({ success: true, message: 'Notifikasi ditandai sudah dibaca.', data: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [USER] Tandai semua notifikasi sebagai sudah dibaca
 * PATCH /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    return res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * [USER] Detail satu notifikasi (auto-mark as read)
 * GET /api/notifications/:id
 */
exports.getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await Notification.findOne({ where: { id, userId } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });

    // Auto-mark as read when viewed
    if (!notif.isRead) {
      await notif.update({ isRead: true, readAt: new Date() });
    }

    return res.json({ success: true, data: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
