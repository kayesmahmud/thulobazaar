const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configuration
const config = require('./config/env');
const pool = require('./config/database');

// Import middleware
const {
  helmetConfig,
  apiLimiter,
  customSecurityHeaders,
  sanitizeRequest,
} = require('./middleware/security');

const {
  errorHandler,
  notFound
} = require('./middleware/errorHandler');

// Import services
const { typesenseService } = require('./services');

// Import utilities
const { MobileLocationService } = require('./utils/mobileLocationUtils');

// Initialize Express app
const app = express();
const PORT = config.PORT;

// Initialize mobile location service
global.mobileLocationService = new MobileLocationService(pool);

// Make pool available globally
global.pool = pool;

// Ensure upload directories exist
const uploadDir = 'uploads/ads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// SECURITY MIDDLEWARE (Order matters!)
// =====================================================

// 1. Trust proxy (if behind reverse proxy like Nginx)
app.set('trust proxy', 1);

// 2. CORS configuration - MUST BE BEFORE HELMET for proper preflight handling
app.use(cors({
  origin: config.NODE_ENV === 'development'
    ? [...config.CORS_ORIGIN, '*'] // Allow all in development
    : config.CORS_ORIGIN, // Strict in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
}));

// 3. Security headers
app.use(helmetConfig());
app.use(customSecurityHeaders);

// 4. Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Data sanitization
app.use(sanitizeRequest);

// 6. General rate limiting for all API routes
app.use('/api/', apiLimiter);

// 7. Serve uploaded files statically with CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN.join(','));
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// =====================================================
// ROUTES
// =====================================================

// Import API routes
const apiRoutes = require('./routes');

// Mount API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Thulobazaar API',
    version: '2.0',
    endpoints: {
      auth: '/api/auth',
      ads: '/api/ads',
      categories: '/api/categories',
      locations: '/api/locations',
      health: '/api/health'
    }
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// =====================================================
// SERVER STARTUP
// =====================================================

// Initialize Typesense
typesenseService.initializeCollection().catch(err => {
  console.error('Failed to initialize Typesense:', err);
});

// Start server
app.listen(PORT, () => {
  console.log('\n==================================================');
  console.log('🚀 Thulobazaar Server Started Successfully!');
  console.log('==================================================');
  console.log(`📌 Environment: ${config.NODE_ENV}`);
  console.log(`📌 Port: ${PORT}`);
  console.log(`📌 Database: ${process.env.DB_NAME}`);
  console.log(`📌 Server: http://localhost:${PORT}`);
  console.log('');
  console.log('📡 API Endpoints:');
  console.log(`   - http://localhost:${PORT}/api/test`);
  console.log(`   - http://localhost:${PORT}/api/ads`);
  console.log(`   - http://localhost:${PORT}/api/categories`);
  console.log(`   - http://localhost:${PORT}/api/locations`);
  console.log(`   - http://localhost:${PORT}/api/search (Typesense)`);
  console.log('');
  console.log('🔒 Security Features:');
  console.log('   ✅ Helmet.js - Security headers');
  console.log('   ✅ CORS - Cross-origin protection');
  console.log('   ✅ Rate limiting - DDoS protection');
  console.log('   ✅ Input validation - Joi schemas');
  console.log('   ✅ XSS protection - Data sanitization');
  console.log('   ✅ SQL injection prevention');
  console.log('   ✅ Database indexes - Performance');
  console.log('   ✅ MVC Architecture - Clean code structure');
  console.log('==================================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
  });
});

module.exports = app;