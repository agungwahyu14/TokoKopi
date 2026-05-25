const { Promo, User, UserPromo } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const getPromos = async (req, res, next) => {
  try {
    const now = new Date();
    const promos = await Promo.findAll({
      where: {
        isActive: true,
        [Op.and]: [
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: now } }
            ]
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: now } }
            ]
          }
        ]
      }
    });
    const response = {
      success: true,
      count: promos.length,
      data: promos,
    };
    console.log('getPromos response:', JSON.stringify(response, null, 2));
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const getPromoById = async (req, res, next) => {
  try {
    const promo = await Promo.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });
    
    const response = { success: true, data: promo };
    console.log('getPromoById response:', JSON.stringify(response, null, 2));
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const getLoyaltyPoints = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    return res.status(200).json({ success: true, data: { userId: user.id, points: user.points } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const claimPromo = async (req, res, next) => {
  const { code, promoId, orderId } = req.body;
  if (!code && !promoId) return res.status(400).json({ success: false, message: 'Promo code or ID is required' });

  try {
    let promo;
    if (promoId) {
      promo = await Promo.findOne({ where: { id: promoId, isActive: true } });
    } else {
      promo = await Promo.findOne({ where: { code: code.toUpperCase(), isActive: true } });
    }

    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found or inactive' });

    // Validate Dates
    const now = new Date();
    if (promo.startDate && now < promo.startDate) {
      return res.status(400).json({ success: false, message: 'Promo ini belum dimulai.' });
    }
    if (promo.endDate && now > promo.endDate) {
      return res.status(400).json({ success: false, message: 'Promo ini sudah berakhir.' });
    }

    // Check Usage Limit (Stok)
    if (promo.usageLimit !== null) {
      const claimCount = await UserPromo.count({ where: { promoId: promo.id } });
      if (claimCount >= promo.usageLimit) {
        return res.status(400).json({ success: false, message: 'Maaf, kuota voucher ini sudah habis.' });
      }
    }

    // Handle Point Cost
    if (promo.pointCost > 0) {
      const user = await User.findByPk(req.user.id);
      
      if (!user || user.points < promo.pointCost) {
        return res.status(400).json({ 
          success: false, 
          message: `Poin tidak mencukupi. Dibutuhkan ${promo.pointCost} poin, Anda memiliki ${user?.points || 0} poin.` 
        });
      }

      // Deduct points
      await user.update({ points: user.points - promo.pointCost });
      console.log(`✨ User ${user.id} redeemed promo ${promo.code} for ${promo.pointCost} points`);
    }

    // Create UserPromo record (Claim)
    await UserPromo.create({
      userId: req.user.id,
      promoId: promo.id,
      isUsed: false
    });

    return res.status(200).json({
      success: true,
      message: promo.pointCost > 0 ? 'Promo berhasil ditukar dengan poin' : 'Promo code claimed successfully',
      data: { code: promo.code, title: promo.title, discountType: promo.type, value: promo.value, orderId: orderId || null },
    });
  } catch (error) {
    next(error);
  }
};

const createPromo = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.imageUrl = `/uploads/promos/${req.file.filename}`;
    }
    const promo = await Promo.create(data);
    return res.status(201).json({ success: true, data: promo });
  } catch (error) {
    next(error);
  }
};

const updatePromo = async (req, res, next) => {
  try {
    const promo = await Promo.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });
    
    const data = { ...req.body };
    if (req.file) {
      // Delete old image
      if (promo.imageUrl && promo.imageUrl.startsWith('/uploads/promos/')) {
        const oldPath = path.join(__dirname, '..', promo.imageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      data.imageUrl = `/uploads/promos/${req.file.filename}`;
    }

    await promo.update(data);
    return res.status(200).json({ success: true, data: promo });
  } catch (error) {
    next(error);
  }
};

const deletePromo = async (req, res, next) => {
  try {
    const promo = await Promo.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });
    
    await promo.destroy();
    return res.status(200).json({ success: true, message: 'Promo deleted' });
  } catch (error) {
    next(error);
  }
};

const togglePromoStatus = async (req, res, next) => {
  try {
    const promo = await Promo.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo not found' });
    
    await promo.update({ isActive: !promo.isActive });
    return res.status(200).json({ success: true, data: promo });
  } catch (error) {
    next(error);
  }
};

const getUserVouchers = async (req, res, next) => {
  try {
    const vouchers = await UserPromo.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Promo,
          as: 'promo',
          attributes: ['id', 'code', 'title', 'description', 'type', 'value', 'minSpend', 'maxDiscount', 'imageUrl', 'endDate']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers
    });
  } catch (error) {
    next(error);
  }
};


module.exports = { 
  getPromos, 
  getPromoById, 
  getLoyaltyPoints, 
  claimPromo, 
  getUserVouchers,
  createPromo, 
  updatePromo, 
  deletePromo,
  togglePromoStatus
};