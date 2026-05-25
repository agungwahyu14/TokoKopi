require('dotenv').config();
const { Store, sequelize } = require('../models');

const stores = [
  {
    name: "Toko Kopi Jaya Denpasar",
    address: "Denpasar, Bali",
    city: "Denpasar",
    province: "Bali",
    latitude: -8.6478,
    longitude: 115.2166,
    phone: "0361-123456",
    openTime: "07:00",
    closeTime: "22:00",
    isActive: true,
  },
  {
    name: "Toko Kopi Jaya Kuta",
    address: "Kuta, Bali",
    city: "Kuta",
    province: "Bali",
    latitude: -8.7190,
    longitude: 115.1700,
    phone: "0361-654321",
    openTime: "08:00",
    closeTime: "23:00",
    isActive: true,
  },
];

const seedStores = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected for store seeding.');

    // We use bulkCreate but we might want to prevent duplicates if running multiple times
    // For simplicity, we'll just clear the stores table first or just add them.
    // The user said "pastikan data masuk", usually seeding wipes or adds.
    // I'll just add them.
    
    await Store.bulkCreate(stores);
    console.log('✅ Real stores seeded successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding stores:', error);
    process.exit(1);
  }
};

seedStores();
