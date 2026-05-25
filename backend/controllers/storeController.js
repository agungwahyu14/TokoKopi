const { Store } = require('../models');



const getStores = async (req, res, next) => {
  try {
    const stores = await Store.findAll({ where: { isActive: true } });
    return res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyStores = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Parameter lat dan lng wajib diisi',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Ambil semua toko aktif dari database
    const stores = await Store.findAll({ where: { isActive: true } });

    // Fungsi Haversine
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return parseFloat((R * c).toFixed(1));
    };

    // Hitung jarak dan filter berdasarkan radius
    const storesWithDistance = stores
      .map((store) => ({
        ...store.toJSON(),
        distance: haversine(userLat, userLng, store.latitude, store.longitude),
      }))
      .filter((store) => store.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);

    return res.json({
      success: true,
      data: storesWithDistance,
      userLocation: { lat: userLat, lng: userLng },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    return res.status(200).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

const createStore = async (req, res, next) => {
  try {
    const store = await Store.create(req.body);
    return res.status(201).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    await store.update(req.body);
    return res.status(200).json({ success: true, data: store });
  } catch (error) {
    next(error);
  }
};

const deleteStore = async (req, res, next) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    
    await store.destroy();
    return res.status(200).json({ success: true, message: 'Store deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStores, getNearbyStores, getStoreById, createStore, updateStore, deleteStore };