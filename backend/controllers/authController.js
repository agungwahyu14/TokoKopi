const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Order, sequelize } = require('../models');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};


const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { 
        include: [
          [sequelize.fn('COUNT', sequelize.col('orders.id')), 'totalOrders']
        ] 
      },
      include: [
        { model: Order, as: 'orders', attributes: [], required: false }
      ],
      group: ['User.id']
    });

    const userData = user.toJSON();
    userData.totalOrders = parseInt(userData.totalOrders) || 0;

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, email, gender, birthDate, notifyPromo, notifyOrderStatus } = req.body;
  let photoUrl = req.body.photoUrl;

  // If a file is uploaded, use its path
  if (req.file) {
    photoUrl = `/uploads/profiles/${req.file.filename}`;
  }

  try {
    const user = await User.findByPk(req.user.id);

    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (birthDate) user.birthDate = birthDate;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;
    if (notifyPromo !== undefined) user.notifyPromo = notifyPromo;
    if (notifyOrderStatus !== undefined) user.notifyOrderStatus = notifyOrderStatus;

    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ where: { phone } });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Nomor telepon sudah digunakan' });
      }
      user.phone = phone;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email sudah digunakan' });
      }
      user.email = email;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        birthDate: user.birthDate,
        role: user.role,
        photoUrl: user.photoUrl,
        points: user.points,
        notifyPromo: user.notifyPromo,
        notifyOrderStatus: user.notifyOrderStatus
      },
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
};

const requestOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi' });
  }

  try {
    const user = await User.findOne({ where: { phone } });

    // Jika user sudah terdaftar dan punya PIN, minta PIN langsung
    if (user && user.password) {
      return res.status(200).json({
        success: true,
        requirePIN: true,
        message: 'Nomor terdaftar, silakan masukkan PIN',
      });
    }

    // Jika user baru atau belum punya PIN, kirim OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    if (!user) {
      await User.create({ phone, otpCode: otp, otpExpires: expiry, role: 'customer' });
    } else {
      user.otpCode = otp;
      user.otpExpires = expiry;
      await user.save();
    }

    console.log(`\n--- [OTP Simulation] ---\nPhone: ${phone}\nOTP: ${otp}\n------------------------\n`);

    return res.status(200).json({
      success: true,
      requirePIN: false,
      message: 'OTP berhasil dikirim',
    });
  } catch (error) {
    console.error('requestOTP error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses permintaan' });
  }
};

const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
  }

  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (user.otpCode !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'OTP salah atau kedaluwarsa' });
    }

    // OTP Valid, hapus otp agar tidak bisa dipakai lagi
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP terverifikasi, silakan masukkan PIN',
      data: {
        isNewUser: !user.password // Jika password null, berarti user baru belum set PIN
      }
    });
  } catch (error) {
    console.error('verifyOTP error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

const verifyPIN = async (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ success: false, message: 'Nomor telepon dan PIN wajib diisi' });
  }

  try {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Jika user belum punya password (PIN), maka set PIN baru
    if (!user.password) {
      user.password = pin; // Akan di-hash secara otomatis oleh hook beforeCreate/Update di model User
      await user.save();

      const token = generateToken(user.id);
      return res.status(200).json({
        success: true,
        message: 'PIN berhasil dibuat dan login sukses',
        data: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          points: user.points,
          token,
        },
      });
    }

    // Jika sudah punya PIN, verifikasi
    const isMatch = await user.matchPassword(pin);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'PIN yang Anda masukkan salah' });
    }

    const token = generateToken(user.id);
    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        points: user.points,
        token,
      },
    });
  } catch (error) {
    console.error('verifyPIN error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'Akun berhasil dihapus',
    });
  } catch (error) {
    console.error('deleteAccount error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat menghapus akun' });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logout berhasil',
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        points: user.points,
        token,
      },
    });
  } catch (error) {
    console.error('login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem' });
  }
};

module.exports = { getMe, updateProfile, requestOTP, verifyOTP, verifyPIN, login, logout, deleteAccount };

