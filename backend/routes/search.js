const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

// Use the main database pool
const pool = require('../config/db');

// Search ads
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      category,
      parentCategoryId,
      location,
      minPrice,
      maxPrice,
      condition,
      featured,
      page = 1,
      limit = 20,
      sortBy = 'created_at:desc'
    } = req.query;

    const results = await searchService.search({
      query,
      category,
      parentCategoryId: parentCategoryId ? parseInt(parentCategoryId) : undefined,
      location: location && !isNaN(location) ? parseInt(location) : location,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      condition,
      featured,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy
    });

    // Transform Typesense results to match your existing API format
    const ads = results.hits.map(hit => ({
      id: parseInt(hit.document.id),
      title: hit.document.title,
      description: hit.document.description,
      price: hit.document.price,
      condition: hit.document.condition,
      category_id: hit.document.category_id,
      category_name: hit.document.category_name,
      location_id: hit.document.location_id,
      location_name: hit.document.location_name,
      seller_name: hit.document.seller_name,
      is_featured: hit.document.is_featured,
      is_active: hit.document.is_active,
      created_at: new Date(hit.document.created_at),
      updated_at: new Date(hit.document.updated_at),
      primary_image: hit.document.primary_image,
      // Add search highlights if available
      highlights: hit.highlights || []
    }));

    const totalPages = Math.ceil(results.found / parseInt(limit));

    res.json({
      success: true,
      data: ads,
      pagination: {
        total: results.found,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      facets: results.facet_counts,
      search_time_ms: results.search_time_ms
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Auto-complete/suggestions endpoint
router.get('/suggest', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const results = await searchService.search({
      query,
      limit: 5
    });

    // Extract unique titles and category names for suggestions
    const suggestions = new Set();

    results.hits.forEach(hit => {
      const doc = hit.document;
      if (doc.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(doc.title);
      }
      if (doc.category_name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(doc.category_name);
      }
    });

    res.json({
      success: true,
      suggestions: Array.from(suggestions).slice(0, 8)
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
});

// Get search statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await searchService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search statistics',
      error: error.message
    });
  }
});

// Reindex all ads (admin only - you should add authentication)
router.post('/reindex', async (req, res) => {
  try {
    console.log('🔄 Starting full reindex...');

    // Get all active ads from database
    const adsQuery = `
      SELECT
        a.id, a.title, a.description, a.price, a.condition,
        a.category_id, c.name as category_name,
        a.location_id, l.name as location_name,
        a.seller_name, a.seller_phone,
        a.is_featured,
        CASE WHEN a.status = 'approved' THEN true ELSE false END as is_active,
        a.created_at, a.updated_at,
        '' as primary_image,
        STRING_AGG(ai.file_path, ',') as images
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN ad_images ai ON a.id = ai.ad_id
      WHERE a.status = 'approved'
      GROUP BY a.id, c.name, l.name, a.is_featured, a.status
      ORDER BY a.created_at DESC
    `;

    const { rows: ads } = await pool.query(adsQuery);

    if (ads.length === 0) {
      return res.json({
        success: true,
        message: 'No ads to index'
      });
    }

    // Recreate collection and bulk index
    await searchService.reindexAll();
    await searchService.bulkIndexAds(ads);

    console.log(`✅ Reindexed ${ads.length} ads successfully`);

    res.json({
      success: true,
      message: `Successfully reindexed ${ads.length} ads`,
      count: ads.length
    });

  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({
      success: false,
      message: 'Reindex failed',
      error: error.message
    });
  }
});

module.exports = router;