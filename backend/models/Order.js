const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  finalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('pending', 'pending_payment', 'confirmed', 'processing', 'ready_for_pickup', 'on_delivery', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orderType: {
    type: DataTypes.ENUM('dine-in', 'takeaway', 'pickup', 'delivery'),
    defaultValue: 'pickup',
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'cash',
  },
  paymentToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  promoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'promos',
      key: 'id'
    }
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deliveryLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  deliveryLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  receiverName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  receiverPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  courierCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  courierService: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  biteshipOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vaNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'orders',
});

module.exports = Order;
