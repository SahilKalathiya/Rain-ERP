const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function initDatabase() {
  console.log('Connecting to MySQL Server on localhost:3306...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin123',
      multipleStatements: true
    });

    console.log('Connected to MySQL successfully!');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');

    console.log('Executing database schema script...');
    await connection.query(schemaSql);
    console.log('====================================================');
    console.log('  SUCCESS: Database "rain_erp_db" and all tables created!');
    console.log('====================================================');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('DATABASE_INIT_ERROR:', error);
    process.exit(1);
  }
}

initDatabase();
