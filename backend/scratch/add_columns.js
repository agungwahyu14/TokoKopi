require('dotenv').config();
const { sequelize } = require('../models');

async function addColumns() {
  try {
    console.log('--- Adding Missing Columns to Orders Table ---');
    
    // Check if column exists before adding (to avoid errors if some already exist)
    const [results] = await sequelize.query("SHOW COLUMNS FROM orders");
    const columns = results.map(c => c.Field);

    const newColumns = [
      { name: 'shippingCost', type: 'DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'deliveryAddress', type: 'TEXT NULL' },
      { name: 'deliveryLatitude', type: 'DECIMAL(10,8) NULL' },
      { name: 'deliveryLongitude', type: 'DECIMAL(11,8) NULL' },
      { name: 'receiverName', type: 'VARCHAR(255) NULL' },
      { name: 'receiverPhone', type: 'VARCHAR(255) NULL' },
      { name: 'courierCode', type: 'VARCHAR(255) NULL' },
      { name: 'courierService', type: 'VARCHAR(255) NULL' },
      { name: 'biteshipOrderId', type: 'VARCHAR(255) NULL' }
    ];

    for (const col of newColumns) {
      if (!columns.includes(col.name)) {
        console.log(`Adding column: ${col.name}...`);
        await sequelize.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Column ${col.name} added.`);
      } else {
        console.log(`ℹ️ Column ${col.name} already exists.`);
      }
    }

    console.log('--- Done! All columns are synchronized. ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    process.exit(1);
  }
}

addColumns();
