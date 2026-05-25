require('dotenv').config();
const { sequelize } = require('../models');

async function fixIndices() {
  try {
    const [results] = await sequelize.query('SHOW INDEX FROM users');
    const indicesToDrop = results
      .filter(row => row.Key_name !== 'PRIMARY' && (row.Key_name.includes('email_') || row.Key_name.includes('phone_')))
      .map(row => row.Key_name);

    console.log(`Found ${indicesToDrop.length} redundant indices to drop.`);

    for (const indexName of indicesToDrop) {
      console.log(`Dropping index: ${indexName}`);
      await sequelize.query(`ALTER TABLE users DROP INDEX ${indexName}`);
    }

    console.log('Done cleaning up indices.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indices:', error);
    process.exit(1);
  }
}

fixIndices();
