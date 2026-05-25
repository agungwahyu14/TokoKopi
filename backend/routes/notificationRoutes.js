const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getAllNotificationsAdmin,
  deleteNotification,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationDetail,
  savePushToken,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadNotif = require('../middleware/notificationUploadMiddleware');

// ========= MOBILE (USER) ROUTES =========
// Ambil semua notifikasi saya
router.get('/', protect, getMyNotifications);

// Hitung unread (untuk badge merah di lonceng)
router.get('/unread-count', protect, getUnreadCount);

// Daftarkan / perbarui Expo Push Token perangkat
router.post('/register-token', protect, savePushToken);

// Tandai semua sudah dibaca
router.patch('/read-all', protect, markAllAsRead);

// Detail notifikasi (auto-mark as read)
router.get('/:id', protect, getNotificationDetail);

// Tandai 1 notifikasi sudah dibaca
router.patch('/:id/read', protect, markAsRead);

// ========= ADMIN ROUTES =========
// Kirim notifikasi
router.post('/send', protect, authorize('admin'), uploadNotif.single('image'), sendNotification);

// Lihat semua notifikasi (admin)
router.get('/admin/all', protect, authorize('admin'), getAllNotificationsAdmin);

// Hapus notifikasi
router.delete('/:id', protect, authorize('admin'), deleteNotification);

module.exports = router;
