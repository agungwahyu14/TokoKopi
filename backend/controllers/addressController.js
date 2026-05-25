const { Address } = require('../models');

const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    console.error('getAddresses error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { label, address, city, postalCode, latitude, longitude, isDefault } = req.body;

    if (!label || !address || !city || !postalCode) {
      return res.status(400).json({ success: false, message: 'label, address, city, and postalCode are required' });
    }

    // If setting as default, unset others
    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const newAddress = await Address.create({
      userId,
      label,
      address,
      city,
      postalCode,
      latitude,
      longitude,
      isDefault: isDefault || false
    });

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress,
    });
  } catch (error) {
    console.error('addAddress error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const address = await Address.findOne({ where: { id: addressId, userId } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await address.destroy();

    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('deleteAddress error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAddresses, addAddress, deleteAddress };