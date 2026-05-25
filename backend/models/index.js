const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Category = require('./Category');
const Store = require('./Store');
const Promo = require('./Promo');
const CartItem = require('./CartItem');
const Address = require('./Address');

const UserPromo = require('./UserPromo');
const Rating = require('./Rating');
const Notification = require('./Notification');

// Associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserPromo, { foreignKey: 'userId', as: 'claimedPromos' });
UserPromo.belongsTo(User, { foreignKey: 'userId' });

Promo.hasMany(UserPromo, { foreignKey: 'promoId', as: 'userClaims' });
UserPromo.belongsTo(Promo, { foreignKey: 'promoId', as: 'promo' });

CartItem.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(CartItem, { foreignKey: 'productId' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Category hierarchy
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });

// Product & Category (Many-to-Many)
Product.belongsToMany(Category, { through: 'product_categories', as: 'categories', foreignKey: 'productId' });
Category.belongsToMany(Product, { through: 'product_categories', as: 'products', foreignKey: 'categoryId' });

// Store & Order
Store.hasMany(Order, { foreignKey: 'storeId', as: 'orders' });
Order.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });

// Order & Promo
Promo.hasMany(Order, { foreignKey: 'promoId', as: 'orders' });
Order.belongsTo(Promo, { foreignKey: 'promoId', as: 'promo' });

// Order & Rating
Order.hasOne(Rating, { foreignKey: 'orderId', as: 'rating' });
Rating.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification & User
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  Category,
  Store,
  Promo,
  CartItem,
  Address,
  UserPromo,
  Rating,
  Notification,
};
