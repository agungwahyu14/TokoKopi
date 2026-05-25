require('dotenv').config();
const { sequelize } = require('../models');

const migrateFresh = async () => {
  try {
    await sequelize.authenticate();
    console.log('⏳ Memulai MIGRATE FRESH (Reset Total Database)...');
    
    // force: true akan men-drop semua tabel dan membuatnya ulang
    await sequelize.sync({ force: true });
    
    console.log('✅ DATABASE RESET SUCCESSFUL.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal melakukan Migrate Fresh:', error);
    process.exit(1);
  }
};

migrateFresh();
