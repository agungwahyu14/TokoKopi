require('dotenv').config();
const { sequelize } = require('../models');

const fixPromoTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database.');
    
    // Check if usageLimit column exists
    const [results] = await sequelize.query("SHOW COLUMNS FROM promos LIKE 'usageLimit'");
    
    if (results.length === 0) {
      console.log('⌛ Adding "usageLimit" column to "promos" table...');
      await sequelize.query('ALTER TABLE promos ADD COLUMN usageLimit INT NULL DEFAULT NULL AFTER maxDiscount');
      console.log('✅ Column "usageLimit" added successfully.');
    } else {
      console.log('ℹ️ Column "usageLimit" already exists.');
    }

    const [dateResults] = await sequelize.query("SHOW COLUMNS FROM promos LIKE 'startDate'");
    if (dateResults.length === 0) {
      console.log('⌛ Adding "startDate" and "endDate" columns to "promos" table...');
      await sequelize.query('ALTER TABLE promos ADD COLUMN startDate DATETIME NULL AFTER usageLimit');
      await sequelize.query('ALTER TABLE promos ADD COLUMN endDate DATETIME NULL AFTER startDate');
      await sequelize.query('ALTER TABLE promos ADD COLUMN pointCost INT DEFAULT 0 AFTER endDate');
      console.log('✅ Date and point columns added successfully.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing promo table:', error);
    process.exit(1);
  }
};

fixPromoTable();
