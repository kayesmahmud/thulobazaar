const pool = require('../config/database');

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
   */
  static async findAll(filters = {}) {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      condition,
      datePosted,
      dateFrom,
      dateTo,
      status = 'approved',
      userId,
      sortBy = 'newest',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = filters;

    let query = `
      SELECT a.*, c.name as category_name, c.slug as category_slug,
             l.name as location_name, l.slug as location_slug,
             (SELECT COUNT(*) FROM ad_images WHERE ad_id = a.id) as image_count
      FROM ads a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
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

    // Category filter
    if (category) {
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

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM ads a WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset

    if (status) countQuery += ' AND a.status = $1';
    if (userId) countQuery += ` AND a.user_id = $${userId ? 2 : 1}`;
    if (search) countQuery += ` AND (a.title ILIKE $${paramCount - 2} OR a.description ILIKE $${paramCount - 2})`;

    const countResult = await pool.query(countQuery, countParams);

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
      slug
    } = adData;

    const result = await pool.query(
      `INSERT INTO ads (
        title, slug, description, price, condition,
        category_id, location_id, seller_name, seller_phone,
        user_id, status, view_count, is_featured
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 0, false)
      RETURNING *`,
      [title, slug, description, price, condition, categoryId, locationId, sellerName, sellerPhone, userId]
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
      slug
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
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [title, slug, description, price, condition, categoryId, locationId, sellerName, sellerPhone, id]
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