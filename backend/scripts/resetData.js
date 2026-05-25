require('dotenv').config();
const { sequelize } = require('../models');

const resetData = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = [
      'order_items',
      'orders',
      'cart_items',
      'product_categories',
      'products',
      'categories'
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`TRUNCATE TABLE ${table}`);
        console.log(`✅ Table ${table} truncated.`);
      } catch (err) {
        console.log(`⚠️ Could not truncate ${table} (it might not exist yet):`, err.message);
      }
    }
    
    // Ensure new columns exist in categories
    try {
      await sequelize.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS description VARCHAR(255) NULL AFTER name');
      await sequelize.query('ALTER TABLE categories ADD COLUMN IF NOT EXISTS sortOrder INT DEFAULT 0 AFTER description');
      console.log('✅ Category columns verified.');
    } catch (err) {
      console.log('⚠️ Could not add category columns manually:', err.message);
    }

    // Ensure new columns exist in promos
    try {
      await sequelize.query('ALTER TABLE promos ADD COLUMN IF NOT EXISTS usageLimit INT NULL DEFAULT NULL AFTER maxDiscount');
      console.log('✅ Promo columns verified.');
    } catch (err) {
      console.log('⚠️ Could not add promo columns manually:', err.message);
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n✨ All requested data has been cleared successfully.');
    console.log('💡 You can now run "npm run seed" to restore default categories if needed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting data:', error);
    process.exit(1);
  }
};

resetData();
