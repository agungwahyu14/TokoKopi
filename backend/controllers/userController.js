const { User, Order, sequelize } = require('../models');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || '';
    
    const { Op } = require('sequelize');
    const where = { role: 'customer' };
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'email', 'phone', 'points', 'createdAt',
        [sequelize.fn('COUNT', sequelize.col('orders.id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('orders.totalAmount')), 'totalSpent']
      ],
      include: [
        { 
          model: Order, 
          as: 'orders', 
          attributes: [],
          required: false
        }
      ],
      group: ['User.id'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false,
      distinct: true
    });

    const formattedUsers = users.map(user => {
        const userData = user.toJSON();
        userData.totalOrders = parseInt(userData.totalOrders) || 0;
        userData.totalSpent = parseFloat(userData.totalSpent) || 0;
        return userData;
    });

    return res.status(200).json({
      success: true,
      data: formattedUsers,
      meta: {
        total: count.length, // findAndCountAll with group returns array of counts
        totalPages: Math.ceil(count.length / limit),
        page
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateUserPoints = async (req, res, next) => {
  try {
    const { points } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update({ points });

    return res.status(200).json({
      success: true,
      message: 'User points updated',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, updateUserPoints };
