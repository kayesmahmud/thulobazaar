const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const adRoutes = require('./adRoutes');
const categoryRoutes = require('./categoryRoutes');
const locationRoutes = require('./locationRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/ads', adRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  const { checkPoolHealth } = require('../config/database');
  const poolHealth = checkPoolHealth();

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: poolHealth
  });
});

module.exports = router;