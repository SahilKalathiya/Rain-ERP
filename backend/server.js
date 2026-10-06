const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const procurementRoutes = require('./routes/procurementRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/procurement', procurementRoutes);

// Root and API Info Route
app.get('/', (req, res) => {
  res.redirect('/api');
});

app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Rain ERP Backend API Server is Active 🚀',
    database: 'MySQL (rain_erp_db)',
    endpoints: {
      health: '/api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        me: 'GET /api/auth/me'
      },
      procurement: {
        vendors: 'GET /api/procurement/vendors',
        fabrics: 'GET /api/procurement/fabrics',
        transporters: 'GET /api/procurement/transporters',
        purchaseOrders: 'GET /api/procurement/purchase-orders',
        grns: 'GET /api/procurement/grns',
        qualityChecks: 'GET /api/procurement/quality-checks'
      }
    }
  });
});

// Health Check Root
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Rain ERP Backend Server',
    database: 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`===========================================`);
  console.log(`🚀 Rain ERP Backend Server running on Port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`===========================================`);
  
  // Test MySQL Connection on startup
  await testConnection();
});
