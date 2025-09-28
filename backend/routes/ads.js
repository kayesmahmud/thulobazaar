const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all ads
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ads WHERE status = $1 ORDER BY created_at DESC LIMIT 20',
      ['active']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ad
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ads WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;