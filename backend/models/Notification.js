const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = broadcast to all users
    comment: 'null berarti dikirim ke semua user',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('info', 'promo', 'newsletter', 'order', 'system'),
    defaultValue: 'info',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  targetAll: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'true = kirim ke semua user',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;
