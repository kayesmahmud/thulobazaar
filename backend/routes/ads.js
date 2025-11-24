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

    // Handle location filtering - hierarchical search
    // When user selects a location (e.g., Kathmandu Metro), find all ads in that location AND its child locations (e.g., Thamel)
    if (location && location !== 'all' && !isNaN(parseInt(location))) {
      // Location ID - search hierarchically (includes children)
      paramCount++;
      queryConditions.push(`
        a.location_id IN (
          WITH RECURSIVE location_tree AS (
            -- Start with the selected location
            SELECT id FROM locations WHERE id = $${paramCount}
            UNION ALL
            -- Include all child locations
            SELECT l.id FROM locations l
            INNER JOIN location_tree lt ON l.parent_id = lt.id
          )
          SELECT id FROM location_tree
        )
      `);
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
        u.account_type,
        u.business_verification_status,
        u.individual_verified,
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
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN ad_images ai ON a.id = ai.ad_id
      WHERE ${queryConditions.join(' AND ')}
      GROUP BY a.id, c.name, l.name, u.account_type, u.business_verification_status, u.individual_verified
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

// Get user's ads (protected route) - MUST come before /:id route
router.get('/my-ads', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT
        a.*,
        c.name as category_name,
        c.icon as category_icon,
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
      WHERE a.user_id = $1
      GROUP BY a.id, c.name, c.icon, l.name
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    // Map database fields to match dashboard expectations
    const mappedData = result.rows.map(ad => ({
      ...ad,
      views: ad.view_count || 0,  // Map view_count to views
      status: ad.status === 'approved' ? 'active' : ad.status  // Map approved to active
    }));

    console.log(`✅ Found ${result.rows.length} ads for user ${userId}`);

    res.json({
      success: true,
      data: mappedData
    });
  } catch (error) {
    console.error('❌ Error fetching user ads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user ads',
      error: error.message
    });
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

// Middleware to parse stringified customFields/attributes from FormData
const parseCustomFields = (req, res, next) => {
  console.log('📦 Received req.body:', JSON.stringify(req.body, null, 2));
  console.log('📦 Received files:', req.files?.length || 0);

  // Parse customFields (old format)
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

  // Parse attributes (new monorepo format) and convert to customFields
  if (req.body.attributes && typeof req.body.attributes === 'string') {
    try {
      const parsedAttributes = JSON.parse(req.body.attributes);
      // Merge with existing customFields or use as customFields
      req.body.customFields = req.body.customFields || parsedAttributes;
      console.log('✅ Parsed attributes as customFields:', req.body.customFields);
      // Delete attributes field since schema validation expects customFields
      delete req.body.attributes;
    } catch (error) {
      console.error('❌ Error parsing attributes:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid attributes format'
      });
    }
  }

  // Convert string booleans to actual booleans
  if (req.body.isNegotiable === 'true') req.body.isNegotiable = true;
  if (req.body.isNegotiable === 'false') req.body.isNegotiable = false;

  // Convert string numbers to numbers
  if (req.body.categoryId && typeof req.body.categoryId === 'string') {
    req.body.categoryId = parseInt(req.body.categoryId);
  }
  if (req.body.subcategoryId && typeof req.body.subcategoryId === 'string') {
    req.body.subcategoryId = parseInt(req.body.subcategoryId);
  }
  if (req.body.locationId && typeof req.body.locationId === 'string') {
    req.body.locationId = parseInt(req.body.locationId);
  }
  if (req.body.price && typeof req.body.price === 'string') {
    req.body.price = parseFloat(req.body.price);
  }

  next();
};

// Create new ad (protected route)
router.post('/', rateLimiters.posting, authenticateToken, upload.array('images', 5), validateFileType, parseCustomFields, validate(createAdSchema), catchAsync(async (req, res) => {
  const {
    title,
    description,
    price,
    isNegotiable,
    condition,
    categoryId,
    subcategoryId,
    locationId,
    latitude,
    longitude,
    googleMapsLink,
    sellerName,
    sellerPhone,
    customFields
  } = req.body;

  const userId = req.user.userId;

  // Get user details if sellerName/sellerPhone not provided
  let finalSellerName = sellerName;
  let finalSellerPhone = sellerPhone;

  if (!finalSellerName || !finalSellerPhone) {
    const userResult = await pool.query(
      'SELECT full_name, phone FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      finalSellerName = finalSellerName || user.full_name;
      finalSellerPhone = finalSellerPhone || user.phone;
    }
  }

  // Use locationId directly (can be any location type: province/district/municipality/area)
  const finalLocationId = locationId;

  // Use subcategoryId as the category if provided (preferred), otherwise use categoryId
  const finalCategoryId = subcategoryId || categoryId;

  // Get location hierarchy BEFORE creating ad to generate SEO slug
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

  // Prepare custom_fields JSON - include isNegotiable and any other metadata
  const customFieldsData = {
    ...customFields,
    ...(isNegotiable !== undefined && { isNegotiable }),
    ...(latitude && { latitude }),
    ...(longitude && { longitude }),
    ...(googleMapsLink && { googleMapsLink })
  };

  // Insert ad into database WITHOUT slug first to get the ID
  const adQuery = `
    INSERT INTO ads (title, description, price, condition, category_id, location_id, seller_name, seller_phone, user_id, custom_fields, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved')
    RETURNING id, title, price, created_at
  `;

  const adResult = await pool.query(adQuery, [
    title,
    description,
    price,
    condition || customFields?.condition || 'Used', // Default to 'Used' if not specified
    finalCategoryId,
    finalLocationId,
    finalSellerName,
    finalSellerPhone,
    userId,
    JSON.stringify(customFieldsData)
  ]);

  const ad = adResult.rows[0];

  // Generate SEO-friendly slug with location: title-area OR title-area-1, title-area-2, etc.
  const slug = await generateSeoSlug(ad.id, ad.title, area_name, district_name);

  // Update ad with generated slug
  await pool.query('UPDATE ads SET slug = $1 WHERE id = $2', [slug, ad.id]);

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

  console.log(`✅ Created ad: ${ad.title} with ${req.files?.length || 0} images, slug: ${slug}`);

  res.status(201).json({
    success: true,
    message: 'Ad created successfully',
    data: {
      id: ad.id,
      title: ad.title,
      price: ad.price,
      createdAt: ad.created_at,
      slug: slug,
      imageCount: req.files?.length || 0
    }
  });
}));

// Update ad (protected route)
router.put('/:id', authenticateToken, upload.array('images', 5), validateFileType, parseCustomFields, catchAsync(async (req, res) => {
  const adId = parseInt(req.params.id);
  const userId = req.user.userId;

  // Check if ad exists and user owns it - also fetch existing custom_fields
  const checkQuery = `
    SELECT id, user_id, title, custom_fields FROM ads WHERE id = $1
  `;
  const checkResult = await pool.query(checkQuery, [adId]);

  if (checkResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }

  const ad = checkResult.rows[0];
  if (ad.user_id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to edit this ad'
    });
  }

  let {
    title,
    description,
    price,
    isNegotiable,
    condition,
    categoryId,
    subcategoryId,
    locationId,
    areaId,
    status,
    latitude,
    longitude,
    googleMapsLink,
    customFields,
    attributes,  // Frontend sends attributes instead of customFields
    existingImages  // Array of image URLs to keep (JSON string from FormData)
  } = req.body;

  // Parse existingImages if it's a JSON string from FormData
  if (existingImages && typeof existingImages === 'string') {
    try {
      existingImages = JSON.parse(existingImages);
    } catch (e) {
      console.error('Failed to parse existingImages:', e);
      existingImages = [];
    }
  }

  console.log('🖼️  [UPDATE AD] Ad ID:', adId);
  console.log('🖼️  [UPDATE AD] Existing images to keep:', existingImages);
  console.log('🖼️  [UPDATE AD] New files received:', req.files?.length || 0);
  if (req.files && req.files.length > 0) {
    console.log('🖼️  [UPDATE AD] New file details:', req.files.map(f => ({ filename: f.filename, size: f.size, path: f.path })));
  }

  // Use subcategoryId as the category if provided, otherwise use categoryId
  const finalCategoryId = subcategoryId || categoryId;

  // Use areaId if provided, otherwise fall back to locationId
  const finalLocationId = areaId || locationId;

  // Get existing custom_fields from database
  const existingCustomFields = ad.custom_fields || {};

  // Merge existing custom_fields with new data (new data takes priority)
  const newCustomFieldsFromBody = attributes || customFields || {};
  const customFieldsData = {
    ...existingCustomFields,  // Start with existing fields
    ...newCustomFieldsFromBody,  // Override with new fields
    ...(isNegotiable !== undefined && { isNegotiable }),
    ...(latitude && { latitude }),
    ...(longitude && { longitude }),
    ...(googleMapsLink && { googleMapsLink })
  };

  // Update ad in database
  const updateQuery = `
    UPDATE ads
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      price = COALESCE($3, price),
      condition = COALESCE($4, condition),
      category_id = COALESCE($5, category_id),
      location_id = COALESCE($6, location_id),
      custom_fields = COALESCE($7, custom_fields),
      status = COALESCE($8, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING id, title, price, updated_at
  `;

  const updateResult = await pool.query(updateQuery, [
    title || null,
    description || null,
    price || null,
    condition || null,
    finalCategoryId || null,
    finalLocationId || null,
    JSON.stringify(customFieldsData),  // Always send merged custom_fields
    status || null,
    adId
  ]);

  const updatedAd = updateResult.rows[0];

  // Handle existing images - remove those not in the existingImages array
  if (existingImages && Array.isArray(existingImages)) {
    // Get all current images for this ad
    const currentImagesResult = await pool.query(
      'SELECT id, file_path FROM ad_images WHERE ad_id = $1',
      [adId]
    );

    // Delete images that are not in the existingImages array
    for (const image of currentImagesResult.rows) {
      if (!existingImages.includes(image.file_path) && !existingImages.includes(`http://localhost:5000/${image.file_path}`)) {
        await pool.query('DELETE FROM ad_images WHERE id = $1', [image.id]);

        // Optionally delete the file from disk
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', image.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  }

  // Handle new image uploads if any
  if (req.files && req.files.length > 0) {
    // Get current image count to determine if new images should be primary
    const imageCountResult = await pool.query(
      'SELECT COUNT(*) FROM ad_images WHERE ad_id = $1',
      [adId]
    );
    const currentImageCount = parseInt(imageCountResult.rows[0].count);
    console.log('🖼️  [UPDATE AD] Current image count in DB before adding new:', currentImageCount);

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const isPrimary = currentImageCount === 0 && i === 0;
      console.log(`🖼️  [UPDATE AD] Inserting new image ${i + 1}:`, {
        filename: file.filename,
        path: file.path,
        isPrimary
      });

      await pool.query(
        `INSERT INTO ad_images (ad_id, filename, original_name, file_path, file_size, mime_type, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          adId,
          file.filename,
          file.originalname,
          file.path,
          file.size,
          file.mimetype,
          isPrimary
        ]
      );
      console.log(`✅ [UPDATE AD] Successfully inserted image ${i + 1} into database`);
    }
  }

  console.log(`✅ Updated ad: ${updatedAd.title} with ${req.files?.length || 0} new images`);

  res.status(200).json({
    success: true,
    message: 'Ad updated successfully',
    data: {
      id: updatedAd.id,
      title: updatedAd.title,
      price: updatedAd.price,
      updatedAt: updatedAd.updated_at,
      newImageCount: req.files?.length || 0
    }
  });
}));

module.exports = router;