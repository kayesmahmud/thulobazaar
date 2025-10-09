const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'elw',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'thulobazaar',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

module.exports = pool;