const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Promo = sequelize.define('Promo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('percent', 'flat'),
    allowNull: false,
    defaultValue: 'percent',
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  minSpend: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  maxDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null, // null means unlimited
  },
  pointCost: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // 0 means free/code-only
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'promos',
});

module.exports = Promo;
