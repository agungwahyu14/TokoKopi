require('dotenv').config();
const { sequelize } = require('../models');

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ MySQL Database synchronized');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database synchronization error:', err);
    if (err.original) {
      console.error('Original Error:', err.original);
    }
    process.exit(1);
  });
