require('dotenv').config();
const { sequelize } = require('../models');

async function cleanupIndexes() {
  try {
    console.log('--- Cleaning up redundant indexes on users table ---');
    
    // Get all indexes for the users table
    const [results] = await sequelize.query("SHOW INDEX FROM users");
    
    // Filter out the PRIMARY key and keep track of unique columns we want to keep
    const seenColumns = new Set(['PRIMARY']);
    const indexesToDelete = [];

    for (const index of results) {
      const indexName = index.Key_name;
      const columnName = index.Column_name;

      if (indexName === 'PRIMARY') continue;

      // If we've already seen an index for this column, mark this index for deletion
      if (seenColumns.has(columnName)) {
        indexesToDelete.push(indexName);
      } else {
        seenColumns.add(columnName);
      }
    }

    if (indexesToDelete.length === 0) {
      console.log('✅ No redundant indexes found.');
    } else {
      console.log(`Found ${indexesToDelete.length} redundant indexes. Deleting...`);
      for (const indexName of indexesToDelete) {
        try {
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
          console.log(`Dropped index: ${indexName}`);
        } catch (e) {
          console.error(`Failed to drop index ${indexName}:`, e.message);
        }
      }
      console.log('✅ Cleanup complete.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up indexes:', error.message);
    process.exit(1);
  }
}

cleanupIndexes();
