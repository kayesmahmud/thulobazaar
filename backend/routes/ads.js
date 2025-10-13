const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { rateLimiters } = require('../utils/rateLimiter');
const { validate, createAdSchema } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { upload, validateFileType } = require('../middleware/secureFileUpload');
const { generateSlug, generateSeoSlug } = require('../utils/slugUtils');

// Get all ads with images
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      location,
      parentCategoryId,
      location_name,
      minPrice,
      maxPrice,
      condition,
      sortBy = 'newest',
      limit = 20,
      offset = 0
    } = req.query;

    let queryConditions = ['a.status = $1'];
    let queryParams = ['approved'];
    let paramCount = 1;

    // Add filters
    if (search && search.trim()) {
      paramCount++;
      queryConditions.push(`(a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`);
      queryParams.push(`%${search.trim()}%`);
    }

    // Handle category filtering - support both ID and name, plus parent category
    if (parentCategoryId && !isNaN(parseInt(parentCategoryId))) {
      // Filter by parent category - includes all subcategories
      paramCount++;
      queryConditions.push(`(c.id = $${paramCount} OR c.parent_id = $${paramCount})`);
      queryParams.push(parseInt(parentCategoryId));
    } else if (category && category !== 'all') {
      if (!isNaN(parseInt(category))) {
        // Category is an ID
        paramCount++;
        queryConditions.push(`a.category_id = $${paramCount}`);
        queryParams.push(parseInt(category));
      } else {
        // Category is a name (for subcategories)
        paramCount++;
        queryConditions.push(`c.name ILIKE $${paramCount}`);
        queryParams.push(category);
      }
    }

    // Handle location filtering - support both ID and hierarchical location name
    if (location && location !== 'all' && !isNaN(parseInt(location))) {
      // Direct location ID
      paramCount++;
      queryConditions.push(`a.location_id = $${paramCount}`);
      queryParams.push(parseInt(location));
    } else if (location_name) {
      // Location name - search in hierarchy (any level)
      paramCount++;
      queryConditions.push(`
        a.location_id IN (
          WITH RECURSIVE location_tree AS (
            SELECT id FROM locations WHERE name ILIKE $${paramCount}
            UNION ALL
            SELECT l.id FROM locations l
            INNER JOIN location_tree lt ON l.parent_id = lt.id
          )
          SELECT id FROM location_tree
        )
      `);
      queryParams.push(location_name);
    }

    if (minPrice && !isNaN(minPrice)) {
      paramCount++;
      queryConditions.push(`a.price >= $${paramCount}`);
      queryParams.push(parseFloat(minPrice));
    }

    if (maxPrice && !isNaN(maxPrice)) {
      paramCount++;
      queryConditions.push(`a.price <= $${paramCount}`);
      queryParams.push(parseFloat(maxPrice));
    }

    if (condition && condition !== 'all') {
      paramCount++;
      queryConditions.push(`a.condition = $${paramCount}`);
      queryParams.push(condition);
    }

    // Sorting
    let orderBy = 'a.created_at DESC';
    if (sortBy === 'price-low') orderBy = 'a.price ASC';
    else if (sortBy === 'price-high') orderBy = 'a.price DESC';
    else if (sortBy === 'oldest') orderBy = 'a.created_at ASC';

    const query = `
      SELECT
        a.*,
        c.name as category_name,
        l.name as location_name,
        (SELECT ai2.filename FROM ad_images ai2 WHERE ai2.ad_id = a.id AND ai2.is_primary = true LIMIT 1) as primary_image,
        json_agg(
          json_build_object(
            'id', ai.id,
            'filename', ai.filename,
            'file_path', ai.file_path,
            'is_primary', ai.is_primary
          ) ORDER BY ai.is_primary DESC, ai.created_at ASC
        ) FILTER (WHERE ai.id IS NOT NULL) as images
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN ad_images ai ON a.id = ai.ad_id
      WHERE ${queryConditions.join(' AND ')}
      GROUP BY a.id, c.name, l.name
      ORDER BY ${orderBy}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));
    const result = await pool.query(query, queryParams);

    // Get total count - must include same JOINs as main query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE ${queryConditions.join(' AND ')}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single ad with images
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      WITH RECURSIVE location_hierarchy AS (
        -- Base case: get the ad's direct location
        SELECT
          id,
          name,
          type,
          parent_id,
          slug,
          0 as level
        FROM locations
        WHERE id = (SELECT location_id FROM ads WHERE id = $1)

        UNION ALL

        -- Recursive case: get parent locations
        SELECT
          l.id,
          l.name,
          l.type,
          l.parent_id,
          l.slug,
          lh.level + 1
        FROM locations l
        INNER JOIN location_hierarchy lh ON l.id = lh.parent_id
      )
      SELECT
        a.*,
        c.name as category_name,
        c.parent_id as category_parent_id,
        parent_cat.name as parent_category_name,
        l.name as location_name,
        l.slug as location_slug,
        u.account_type,
        u.shop_slug,
        u.seller_slug,
        u.avatar as seller_avatar,
        u.individual_verified,
        u.business_verification_status,
        u.business_name,
        -- Extract specific location types from hierarchy
        (SELECT name FROM location_hierarchy WHERE type = 'area' LIMIT 1) as area_name,
        (SELECT name FROM location_hierarchy WHERE type = 'municipality' LIMIT 1) as municipality_name,
        (SELECT name FROM location_hierarchy WHERE type = 'district' LIMIT 1) as district_name,
        (SELECT name FROM location_hierarchy WHERE type = 'province' LIMIT 1) as province_name,
        (SELECT ai2.filename FROM ad_images ai2 WHERE ai2.ad_id = a.id AND ai2.is_primary = true LIMIT 1) as primary_image,
        json_agg(
          json_build_object(
            'id', ai.id,
            'filename', ai.filename,
            'file_path', ai.file_path,
            'is_primary', ai.is_primary
          ) ORDER BY ai.is_primary DESC, ai.created_at ASC
        ) FILTER (WHERE ai.id IS NOT NULL) as images
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN ad_images ai ON a.id = ai.ad_id
      WHERE a.id = $1 AND a.status = 'approved'
      GROUP BY a.id, c.name, c.parent_id, parent_cat.name, l.name, l.slug, u.account_type, u.shop_slug, u.seller_slug, u.avatar, u.individual_verified, u.business_verification_status, u.business_name
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    // Increment view count
    await pool.query('UPDATE ads SET view_count = view_count + 1 WHERE id = $1', [id]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware to parse stringified customFields from FormData
const parseCustomFields = (req, res, next) => {
  console.log('📦 Received req.body:', JSON.stringify(req.body, null, 2));
  console.log('📦 Received files:', req.files?.length || 0);

  if (req.body.customFields && typeof req.body.customFields === 'string') {
    try {
      req.body.customFields = JSON.parse(req.body.customFields);
      console.log('✅ Parsed customFields:', req.body.customFields);
    } catch (error) {
      console.error('❌ Error parsing customFields:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid customFields format'
      });
    }
  }
  next();
};

// Create new ad (protected route)
router.post('/', rateLimiters.posting, authenticateToken, upload.array('images', 5), validateFileType, parseCustomFields, validate(createAdSchema), catchAsync(async (req, res) => {
  const {
    title,
    description,
    price,
    condition,
    categoryId,
    locationId,
    areaId,
    sellerName,
    sellerPhone,
    customFields
  } = req.body;

  const userId = req.user.userId;

  // Use areaId if provided, otherwise fall back to locationId for backward compatibility
  const finalLocationId = areaId || locationId;

  // Generate unique slug from title
  const slug = await generateSlug(title);

  // Insert ad into database
  const adQuery = `
    INSERT INTO ads (title, description, price, condition, category_id, location_id, seller_name, seller_phone, user_id, slug, custom_fields, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved')
    RETURNING id, title, price, created_at
  `;

  const adResult = await pool.query(adQuery, [
    title,
    description,
    price,
    condition || customFields?.condition,
    categoryId,
    finalLocationId,
    sellerName,
    sellerPhone,
    userId,
    slug,
    JSON.stringify(customFields)
  ]);

  const ad = adResult.rows[0];

  // Handle image uploads if any
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      await pool.query(
        `INSERT INTO ad_images (ad_id, filename, original_name, file_path, file_size, mime_type, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          ad.id,
          file.filename,
          file.originalname,
          file.path,
          file.size,
          file.mimetype,
          i === 0 // First image is primary
        ]
      );
    }
  }

  // Get location hierarchy for SEO slug
  const locationQuery = `
    WITH RECURSIVE location_hierarchy AS (
      SELECT id, name, type, parent_id, 0 as level
      FROM locations WHERE id = $1
      UNION ALL
      SELECT l.id, l.name, l.type, l.parent_id, lh.level + 1
      FROM locations l
      INNER JOIN location_hierarchy lh ON l.id = lh.parent_id
    )
    SELECT
      (SELECT name FROM location_hierarchy WHERE type = 'area' LIMIT 1) as area_name,
      (SELECT name FROM location_hierarchy WHERE type = 'district' LIMIT 1) as district_name
  `;

  const locationResult = await pool.query(locationQuery, [finalLocationId]);
  const { area_name, district_name } = locationResult.rows[0] || {};

  // Generate SEO-friendly slug: title-area-district--id
  const seoSlug = generateSeoSlug(ad.id, ad.title, area_name, district_name);

  console.log(`✅ Created ad: ${ad.title} with ${req.files?.length || 0} images, SEO slug: ${seoSlug}`);

  res.status(201).json({
    success: true,
    message: 'Ad created successfully',
    data: {
      id: ad.id,
      title: ad.title,
      price: ad.price,
      createdAt: ad.created_at,
      slug,
      seo_slug: seoSlug,
      imageCount: req.files?.length || 0
    }
  });
}));

module.exports = router;