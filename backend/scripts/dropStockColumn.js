require('dotenv').config();
const { sequelize } = require('../models');

const dropStockColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
    
    // Check if column exists first
    const [results] = await sequelize.query("SHOW COLUMNS FROM products LIKE 'stock'");
    
    if (results.length > 0) {
      await sequelize.query('ALTER TABLE products DROP COLUMN stock');
      console.log('✅ Column "stock" has been dropped from products table.');
    } else {
      console.log('ℹ️ Column "stock" does not exist in products table.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error dropping stock column:', error);
    process.exit(1);
  }
};

dropStockColumn();
