require('dotenv').config();

// Environment configuration with validation
const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 5000,

  // Database
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,

  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Typesense
  TYPESENSE_HOST: process.env.TYPESENSE_HOST || 'localhost',
  TYPESENSE_PORT: parseInt(process.env.TYPESENSE_PORT) || 8108,
  TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL || 'http',
  TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173'],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Validate critical environment variables
const validateConfig = () => {
  const requiredVars = [
    'JWT_SECRET',
    'DB_USER',
    'DB_NAME'
  ];

  const missingVars = requiredVars.filter(varName => !config[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Warn about default JWT secret
  if (config.JWT_SECRET === 'your-secret-key-here' || config.JWT_SECRET.length < 32) {
    console.warn('⚠️  WARNING: Using weak or default JWT_SECRET. Please use a strong secret in production!');
  }

  // Warn if in production without proper settings
  if (config.NODE_ENV === 'production') {
    if (!process.env.DB_PASSWORD) {
      console.warn('⚠️  WARNING: No database password set in production!');
    }
    if (config.CORS_ORIGIN.includes('localhost')) {
      console.warn('⚠️  WARNING: CORS is allowing localhost in production!');
    }
  }
};

// Run validation
validateConfig();

module.exports = config;