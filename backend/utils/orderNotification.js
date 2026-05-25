const { Notification, User } = require('../models');
const { sendExpoPushNotifications } = require('./pushNotification');

// Map berisi judul dan isi pesan notifikasi untuk setiap status pesanan
const STATUS_NOTIF_MAP = {
  pending_payment: {
    title: '🛍️ Menunggu Pembayaran',
    message: 'Pesanan #${orderNumber} telah dibuat. Silakan selesaikan pembayaran kamu.',
  },
  confirmed: {
    title: '✅ Pesanan Dikonfirmasi',
    message: 'Pesanan #${orderNumber} kamu sudah dikonfirmasi dan sedang diproses.',
  },
  processing: {
    title: '🔄 Pesanan Sedang Diproses',
    message: 'Pesanan #${orderNumber} sedang disiapkan oleh barista kami.',
  },
  ready_for_pickup: {
    title: '🛎️ Pesanan Siap Diambil',
    message: 'Pesanan #${orderNumber} sudah siap! Silakan ambil di toko.',
  },
  on_delivery: {
    title: '🚚 Pesanan Sedang Diantar',
    message: 'Pesanan #${orderNumber} sedang dalam perjalanan ke alamat kamu.',
  },
  completed: {
    title: '🎉 Pesanan Selesai',
    message: 'Pesanan #${orderNumber} telah selesai. Terima kasih sudah memesan di Toko Kopi Jaya!',
  },
  cancelled: {
    title: '❌ Pesanan Dibatalkan',
    message: 'Pesanan #${orderNumber} telah dibatalkan. Hubungi kami jika ada pertanyaan.',
  },
};

/**
 * Mengirim notifikasi perubahan status pesanan otomatis ke user via Database & Push Notification.
 * @param {object} order - Object order dari Sequelize (harus berisi id, userId, orderNumber, dan status)
 */
async function sendOrderStatusNotification(order) {
  try {
    const { id: orderId, userId, orderNumber, status } = order;

    if (!userId || !status) {
      console.warn('[OrderNotif] Gagal kirim notifikasi: userId atau status tidak ditemukan.');
      return;
    }

    const template = STATUS_NOTIF_MAP[status];
    if (!template) {
      console.log(`[OrderNotif] Tidak ada template notifikasi untuk status "${status}".`);
      return;
    }

    // Format pesan
    const title = template.title;
    const message = template.message.replace('${orderNumber}', orderNumber);

    // 1. Simpan ke database
    const notif = await Notification.create({
      userId,
      title,
      message,
      type: 'order',
      isRead: false,
      targetAll: false,
    });

    console.log(`[OrderNotif] Notifikasi disimpan di database untuk user ${userId} (ID: ${notif.id})`);

    // 2. Ambil data user beserta expoPushToken dan preferensi notifikasinya
    const user = await User.findByPk(userId, { attributes: ['id', 'expoPushToken', 'notifyOrderStatus'] });
    if (user && user.expoPushToken) {
      if (user.notifyOrderStatus === false) {
        console.log(`[OrderNotif] User ${userId} menonaktifkan notifikasi status pesanan. Push ditangguhkan.`);
        return;
      }
      
      // 3. Kirim push notification riil ke HP
      await sendExpoPushNotifications(user.expoPushToken, title, message, {
        type: 'order',
        orderId: String(orderId),
        notificationId: notif.id,
        screen: 'orders/[id]', // Langsung arahkan ke detail pesanan jika di-tap
      });
      console.log(`[OrderNotif] Push notification berhasil dikirim ke token user ${userId}`);
    } else {
      console.log(`[OrderNotif] User ${userId} tidak memiliki token push notification terdaftar.`);
    }
  } catch (error) {
    // Tangani error agar tidak membuat crash transaksi database utama
    console.error('[OrderNotif Error]', error.message);
  }
}

module.exports = { sendOrderStatusNotification };
