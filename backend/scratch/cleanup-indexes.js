const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

async function cleanup() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    const [tables] = await sequelize.query('SHOW TABLES');
    const dbName = process.env.DB_NAME;
    const tableKey = `Tables_in_${dbName}`;

    for (const tableRow of tables) {
      const tableName = tableRow[tableKey];
      console.log(`Checking table: ${tableName}`);

      const [indexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
      
      const indexesToDrop = [];
      const seenColumns = new Set();

      for (const index of indexes) {
        const keyName = index.Key_name;
        const columnName = index.Column_name;

        if (keyName === 'PRIMARY') continue;

        // Pattern for redundant indexes created by Sequelize alter: true
        // Usually they look like 'email_2', 'phone_3', 'code_4', etc.
        if (keyName.match(/_\d+$/)) {
          indexesToDrop.push(keyName);
        }
      }

      for (const keyName of indexesToDrop) {
        try {
          console.log(`  Dropping index ${keyName} from ${tableName}...`);
          await sequelize.query(`ALTER TABLE ${tableName} DROP INDEX ${keyName}`);
        } catch (err) {
          console.error(`  Failed to drop index ${keyName}: ${err.message}`);
        }
      }
    }

    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
}

cleanup();
