require('dotenv').config();
const { Product, sequelize } = require('../models');

const clearProducts = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await Product.destroy({ where: {}, truncate: true });
    await sequelize.query('TRUNCATE TABLE product_categories');
    console.log('✅ All products and product-category mappings cleared.');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing products:', error);
    process.exit(1);
  }
};

clearProducts();
