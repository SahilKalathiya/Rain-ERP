const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rain_erp_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test Connection Helper
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database:', process.env.DB_NAME || 'rain_erp_db');
    connection.release();
    return true;
  } catch (err) {
    console.error('⚠️ MySQL Connection Warning:', err.message);
    console.log('👉 Make sure MySQL / XAMPP is running on port', process.env.DB_PORT || 3306);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
