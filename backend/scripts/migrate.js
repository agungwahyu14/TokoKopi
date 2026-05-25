require('dotenv').config();
const { sequelize } = require('../models');

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connected for migration.');

    await sequelize.sync({ alter: true });
    console.log('✅ Database migrated (sync alter complete).');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrate();