const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Kirim Expo Push Notification ke satu atau banyak token.
 * @param {string | string[]} pushTokens - Expo push token(s)
 * @param {string} title - Judul notifikasi
 * @param {string} body - Isi pesan notifikasi
 * @param {object} data - Data tambahan (opsional, dikirim ke app saat tap)
 */
async function sendExpoPushNotifications(pushTokens, title, body, data = {}) {
  const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

  const messages = [];
  for (const pushToken of tokens) {
    if (!pushToken) continue;

    // Validasi token Expo
    if (!Expo.isExpoPushToken(pushToken)) {
      console.warn(`[PushNotif] Token tidak valid, dilewati: ${pushToken}`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'default', // Diperlukan di Android
      priority: 'high',
    });
  }

  if (messages.length === 0) {
    console.log('[PushNotif] Tidak ada token valid untuk dikirim.');
    return;
  }

  // Kirim dalam batch (Expo membatasi 100 per request)
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(`[PushNotif] Terkirim ${ticketChunk.length} notifikasi push.`);

      // Log error per ticket jika ada
      for (const ticket of ticketChunk) {
        if (ticket.status === 'error') {
          console.error(`[PushNotif] Error ticket:`, ticket);
        }
      }
    } catch (err) {
      console.error('[PushNotif] Gagal kirim chunk:', err.message);
    }
  }
}

module.exports = { sendExpoPushNotifications };
