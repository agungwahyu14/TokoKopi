const { sequelize, Product, Order, OrderItem, User } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Active products
    const activeProducts = await Product.count({ where: { isAvailable: true } });

    // 2. Today's orders count
    const todayOrders = await Order.count({
      where: sequelize.where(sequelize.fn('DATE', sequelize.col('createdAt')), sequelize.literal('CURDATE()'))
    });

    // 3. Total customers
    const totalCustomers = await User.count({ where: { role: 'customer' } });

    // 4. Today's revenue
    const todayRevenueResult = await Order.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']],
      where: {
        status: 'completed',
        [Op.and]: [
          sequelize.where(sequelize.fn('DATE', sequelize.col('createdAt')), sequelize.literal('CURDATE()'))
        ]
      },
      raw: true
    });
    const todayRevenue = todayRevenueResult.length > 0 && todayRevenueResult[0].total 
      ? parseFloat(todayRevenueResult[0].total) 
      : 0;

    // 5. Sales Chart (Last 7 days)
    const salesChartRaw = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']
      ],
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 6 DAY)')
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    const salesChart = salesChartRaw.map(item => ({
      date: item.date,
      total: parseFloat(item.total)
    }));

    return res.status(200).json({
      success: true,
      data: {
        todayRevenue,
        todayOrders,
        totalCustomers,
        activeProducts,
        salesChart
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
