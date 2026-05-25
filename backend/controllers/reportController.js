const { Order, OrderItem, Product, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const getSalesReport = async (req, res, next) => {
  const { startDate, endDate, storeId } = req.query;

  const whereCondition = {};
  if (startDate && endDate) {
    whereCondition.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  if (storeId) {
    whereCondition.storeId = storeId;
  }

  try {
    const orders = await Order.findAll({
      where: whereCondition,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    const summary = await Order.findOne({
      where: whereCondition,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgOrderValue']
      ],
      raw: true
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: parseFloat(summary.totalRevenue || 0),
          totalOrders: parseInt(summary.totalOrders || 0),
          avgOrderValue: parseFloat(summary.avgOrderValue || 0).toFixed(2)
        },
        dailyStats: orders
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductReport = async (req, res, next) => {
  try {
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalRevenue']
      ],
      include: [
        { model: Product, as: 'product', attributes: ['name', 'price', 'imageUrl'] }
      ],
      group: ['productId', 'product.id'],
      order: [[sequelize.literal('totalSold'), 'DESC']],
      limit: 10
    });

    return res.status(200).json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerReport = async (req, res, next) => {
  try {
    const topCustomers = await Order.findAll({
      attributes: [
        'userId',
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSpent'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders']
      ],
      include: [
        { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
      ],
      group: ['userId', 'user.id'],
      order: [[sequelize.literal('totalSpent'), 'DESC']],
      limit: 10
    });

    return res.status(200).json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, getProductReport, getCustomerReport };
