/**
 * Script migrasi: Tambahkan nilai 'newsletter' ke ENUM type di tabel notifications
 * Jalankan: node scripts/migrate-notification-type.js
 */
require('dotenv').config();
const { sequelize } = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Menjalankan migrasi: ALTER notifications.type ENUM...');
    await sequelize.query(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM('info', 'promo', 'newsletter', 'order', 'system') 
      NOT NULL DEFAULT 'info'
    `);
    console.log('✅ Migrasi berhasil! Kolom type sekarang mendukung nilai: info, promo, newsletter, order, system');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migrasi gagal:', error.message);
    process.exit(1);
  }
}

migrate();
