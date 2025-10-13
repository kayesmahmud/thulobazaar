const pool = require('../config/database');
const { AD_STATUS, PAGINATION } = require('../config/constants');

class Ad {
  /**
   * Find ad by ID
   */
  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, c.name as category_name, c.slug as category_slug,
              l.name as location_name, l.slug as location_slug,
              u.full_name as user_name, u.email as user_email
       FROM ads a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN locations l ON a.location_id = l.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find ad by slug
   */
  static async findBySlug(slug) {
    const result = await pool.query(
      `SELECT a.*, c.name as category_name, c.slug as category_slug,
              l.name as location_name, l.slug as location_slug,
              u.full_name as user_name, u.email as user_email
       FROM ads a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN locations l ON a.location_id = l.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.slug = $1`,
      [slug]
    );
    return result.rows[0];
  }

  /**
   * Find all ads with filters
   * Optimized to fetch images in a single query using JSON aggregation
   */
  static async findAll(filters = {}) {
    const {
      search,
      category,
      parentCategoryId,
      location,
      minPrice,
      maxPrice,
      condition,
      datePosted,
      dateFrom,
      dateTo,
      status = AD_STATUS.APPROVED,
      userId,
      sortBy = 'newest',
      sortOrder = 'desc',
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = PAGINATION.DEFAULT_OFFSET
    } = filters;

    let query = `
      SELECT a.*, c.name as category_name, c.slug as category_slug,
             l.name as location_name, l.slug as location_slug,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', ai.id,
                   'ad_id', ai.ad_id,
                   'image_url', ai.image_url,
                   'is_primary', ai.is_primary,
                   'created_at', ai.created_at
                 )
                 ORDER BY ai.is_primary DESC, ai.created_at ASC
               ) FILTER (WHERE ai.id IS NOT NULL),
               '[]'
             ) as images
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN ad_images ai ON a.id = ai.ad_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Status filter
    if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // User filter
    if (userId) {
      query += ` AND a.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }

    // Search filter
    if (search) {
      query += ` AND (a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Parent Category filter (includes all subcategories)
    if (parentCategoryId) {
      // Get all subcategory IDs for this parent category
      const subcatsResult = await pool.query(
        'SELECT id FROM categories WHERE parent_id = $1',
        [parentCategoryId]
      );
      const subcategoryIds = subcatsResult.rows.map(row => row.id);

      // Include parent category AND all subcategories
      const categoryIds = [parentCategoryId, ...subcategoryIds];
      console.log(`🔍 Parent category ${parentCategoryId} includes subcategories:`, subcategoryIds);
      console.log(`🔍 Final category filter array:`, categoryIds);
      query += ` AND a.category_id = ANY($${paramCount}::int[])`;  // Cast to int array
      params.push(categoryIds);
      paramCount++;
    }
    // Single Category filter
    else if (category) {
      query += ` AND c.name = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Location filter
    if (location) {
      query += ` AND a.location_id = $${paramCount}`;
      params.push(location);
      paramCount++;
    }

    // Price filters
    if (minPrice) {
      query += ` AND a.price >= $${paramCount}`;
      params.push(minPrice);
      paramCount++;
    }

    if (maxPrice) {
      query += ` AND a.price <= $${paramCount}`;
      params.push(maxPrice);
      paramCount++;
    }

    // Condition filter
    if (condition) {
      query += ` AND a.condition = $${paramCount}`;
      params.push(condition);
      paramCount++;
    }

    // Date filters
    if (dateFrom) {
      query += ` AND a.created_at >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }

    if (dateTo) {
      query += ` AND a.created_at <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }

    if (datePosted) {
      const dateFilters = {
        'last24h': '24 hours',
        'last7days': '7 days',
        'last30days': '30 days'
      };
      if (dateFilters[datePosted]) {
        query += ` AND a.created_at >= NOW() - INTERVAL '${dateFilters[datePosted]}'`;
      }
    }

    // Group by all non-aggregated columns
    query += ` GROUP BY a.id, c.name, c.slug, l.name, l.slug`;

    // Sorting
    const sortOptions = {
      newest: 'a.created_at DESC',
      oldest: 'a.created_at ASC',
      price_low: 'a.price ASC',
      price_high: 'a.price DESC',
      popular: 'a.view_count DESC'
    };

    const orderBy = sortOptions[sortBy] || sortOptions.newest;
    query += ` ORDER BY ${orderBy}`;

    // Pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // DEBUG: Log the complete query and parameters
    const fs = require('fs');
    const debugInfo = {
      timestamp: new Date().toISOString(),
      query: query,
      params: params,
      paramCount: params.length
    };
    fs.appendFileSync('/tmp/sql-debug.log', JSON.stringify(debugInfo, null, 2) + '\n---\n');
    console.log('🔍🔍🔍 EXECUTING SQL QUERY 🔍🔍🔍');
    console.log('Query string:', query);
    console.log('Params array:', JSON.stringify(params));

    const result = await pool.query(query, params);
    console.log('🔍 Query returned', result.rows.length, 'rows');

    // Get total count - use same params minus limit and offset
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ads a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE 1=1 ${query.split('WHERE 1=1')[1].split('GROUP BY')[0]}`.replace(/\$\d+/g, (match) => {
        const num = parseInt(match.substring(1));
        return num <= countParams.length ? match : '';
      }).trim(),
      countParams
    );

    return {
      ads: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Create new ad
   */
  static async create(adData) {
    const {
      title,
      description,
      price,
      condition,
      categoryId,
      locationId,
      sellerName,
      sellerPhone,
      userId,
      slug,
      customFields
    } = adData;

    const result = await pool.query(
      `INSERT INTO ads (
        title, slug, description, price, condition,
        category_id, location_id, seller_name, seller_phone,
        user_id, status, view_count, is_featured, custom_fields
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, false, $12)
      RETURNING *`,
      [title, slug, description, price, condition, categoryId, locationId, sellerName, sellerPhone, userId, AD_STATUS.PENDING, JSON.stringify(customFields || {})]
    );

    return result.rows[0];
  }

  /**
   * Update ad
   */
  static async update(id, adData) {
    const {
      title,
      description,
      price,
      condition,
      categoryId,
      locationId,
      sellerName,
      sellerPhone,
      slug,
      customFields
    } = adData;

    const result = await pool.query(
      `UPDATE ads
       SET title = COALESCE($1, title),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           condition = COALESCE($5, condition),
           category_id = COALESCE($6, category_id),
           location_id = COALESCE($7, location_id),
           seller_name = COALESCE($8, seller_name),
           seller_phone = COALESCE($9, seller_phone),
           custom_fields = COALESCE($10, custom_fields),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [title, slug, description, price, condition, categoryId, locationId, sellerName, sellerPhone, customFields ? JSON.stringify(customFields) : null, id]
    );

    return result.rows[0];
  }

  /**
   * Update ad status
   */
  static async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE ads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  /**
   * Increment view count
   */
  static async incrementViews(id) {
    await pool.query(
      'UPDATE ads SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
  }

  /**
   * Toggle featured status
   */
  static async toggleFeatured(id) {
    const result = await pool.query(
      'UPDATE ads SET is_featured = NOT is_featured, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING is_featured',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Delete ad
   */
  static async delete(id) {
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
  }

  /**
   * Check ad ownership
   */
  static async isOwner(adId, userId) {
    const result = await pool.query(
      'SELECT user_id FROM ads WHERE id = $1',
      [adId]
    );
    return result.rows[0]?.user_id === userId;
  }
}

module.exports = Ad;