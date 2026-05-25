const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserPromo = sequelize.define('UserPromo', {
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
  promoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'promos',
      key: 'id'
    }
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'user_promos',
});

module.exports = UserPromo;
