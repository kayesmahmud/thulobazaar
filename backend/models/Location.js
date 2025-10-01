const pool = require('../config/database');

class Location {
  /**
   * Find all locations
   */
  static async findAll() {
    const result = await pool.query(
      'SELECT * FROM locations ORDER BY name ASC'
    );
    return result.rows;
  }

  /**
   * Find location by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find location by slug
   */
  static async findBySlug(slug) {
    const result = await pool.query(
      'SELECT * FROM locations WHERE slug = $1',
      [slug]
    );
    return result.rows[0];
  }

  /**
   * Create new location
   */
  static async create(locationData) {
    const { name, slug, latitude, longitude } = locationData;

    const result = await pool.query(
      'INSERT INTO locations (name, slug, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, latitude || null, longitude || null]
    );

    return result.rows[0];
  }

  /**
   * Update location
   */
  static async update(id, locationData) {
    const { name, slug, latitude, longitude } = locationData;

    const result = await pool.query(
      `UPDATE locations
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude)
       WHERE id = $5
       RETURNING *`,
      [name, slug, latitude, longitude, id]
    );

    return result.rows[0];
  }

  /**
   * Delete location
   */
  static async delete(id) {
    await pool.query('DELETE FROM locations WHERE id = $1', [id]);
  }

  /**
   * Get location with ad count
   */
  static async findAllWithCount() {
    const result = await pool.query(
      `SELECT l.*, COUNT(a.id) as ad_count
       FROM locations l
       LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
       GROUP BY l.id
       ORDER BY l.name ASC`
    );
    return result.rows;
  }
}

module.exports = Location;