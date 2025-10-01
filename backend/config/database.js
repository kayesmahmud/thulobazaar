const { Pool } = require('pg');
require('dotenv').config();

// Environment-based pool configuration
const isProduction = process.env.NODE_ENV === 'production';

// Database configuration with optimized pool settings
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 5432,

  // Connection Pool Configuration
  max: parseInt(process.env.DB_POOL_MAX) || (isProduction ? 50 : 20), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN) || (isProduction ? 10 : 5),  // Minimum connections

  // Timeout Configuration
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Close idle clients after 30s
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 5000, // Connection timeout 5s

  // Query timeout (prevents long-running queries from blocking pool)
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000, // 30 seconds max per query

  // Application name for monitoring
  application_name: 'thulobazaar_backend',

  // SSL configuration for production
  ssl: isProduction ? {
    rejectUnauthorized: false // Set to true with proper cert in production
  } : false,
};

// Validate required configuration
if (!dbConfig.user || !dbConfig.database) {
  throw new Error('Database configuration is incomplete. Please check your .env file.');
}

// Create connection pool
const pool = new Pool(dbConfig);

// Pool metrics tracking
let poolMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  waitingClients: 0,
  errors: 0,
  lastError: null
};

// Handle pool errors with retry logic
let errorCount = 0;
const MAX_ERRORS = 5;
const ERROR_RESET_TIME = 60000; // Reset error count after 1 minute

pool.on('error', (err, client) => {
  errorCount++;
  poolMetrics.errors++;
  poolMetrics.lastError = {
    message: err.message,
    timestamp: new Date().toISOString()
  };

  console.error(`❌ Database pool error (${errorCount}/${MAX_ERRORS}):`, err.message);
  console.error('Error details:', {
    code: err.code,
    severity: err.severity,
    detail: err.detail
  });

  // Reset error count after ERROR_RESET_TIME
  setTimeout(() => {
    if (errorCount > 0) errorCount--;
  }, ERROR_RESET_TIME);

  // Only exit if too many errors in short time
  if (errorCount >= MAX_ERRORS) {
    console.error('🚨 Too many database errors, shutting down...');
    process.exit(-1);
  }
});

// Handle client connection events
pool.on('connect', (client) => {
  poolMetrics.totalConnections++;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 New database client connected');
  }
});

pool.on('acquire', (client) => {
  poolMetrics.activeConnections++;
  poolMetrics.idleConnections = Math.max(0, poolMetrics.idleConnections - 1);
});

pool.on('release', (err, client) => {
  poolMetrics.activeConnections = Math.max(0, poolMetrics.activeConnections - 1);
  poolMetrics.idleConnections++;
});

pool.on('remove', (client) => {
  poolMetrics.totalConnections = Math.max(0, poolMetrics.totalConnections - 1);
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Database client removed from pool');
  }
});

// Test database connection with retry logic
const connectWithRetry = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ Database connected successfully');
      console.log(`📊 Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
      console.log(`⚙️  Pool Config: min=${dbConfig.min}, max=${dbConfig.max}, timeout=${dbConfig.connectionTimeoutMillis}ms`);
      client.release();
      return;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to connect to database after ${retries} attempts`);
      }
    }
  }
};

// Initialize connection
connectWithRetry().catch(err => {
  console.error('🚨 Fatal: Could not establish database connection');
  process.exit(-1);
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\n🔄 Closing database connections...');
  try {
    await pool.end();
    console.log('✅ Database connections closed gracefully');
  } catch (err) {
    console.error('❌ Error closing database connections:', err);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Health check function
const checkPoolHealth = () => {
  return {
    healthy: errorCount < MAX_ERRORS,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
    metrics: poolMetrics,
    config: {
      max: dbConfig.max,
      min: dbConfig.min,
      idleTimeout: dbConfig.idleTimeoutMillis,
      connectionTimeout: dbConfig.connectionTimeoutMillis
    }
  };
};

// Log pool stats periodically in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = checkPoolHealth();
    if (stats.total > 0) {
      console.log(`📊 Pool Stats - Total: ${stats.total}, Idle: ${stats.idle}, Waiting: ${stats.waiting}`);
    }
  }, 60000); // Every minute
}

module.exports = pool;
module.exports.checkPoolHealth = checkPoolHealth;