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

  /**
   * Search areas/places with autocomplete
   * Format: (Area Name, Ward X, Municipality Name)
   */
  static async searchAreas(searchTerm, limit = 10) {
    const query = `
      SELECT
        a.id,
        a.name as area_name,
        a.name_np as area_name_np,
        a.ward_number,
        a.area_type,
        a.is_popular,
        m.name as municipality_name,
        m.id as municipality_id,
        d.name as district_name,
        d.id as district_id,
        p.name as province_name,
        p.id as province_id,
        a.latitude,
        a.longitude,
        CASE
          WHEN a.ward_number IS NOT NULL THEN
            a.name || ', Ward ' || a.ward_number || ', ' || m.name
          ELSE
            a.name || ', ' || m.name
        END as display_text,
        -- Ranking: prioritize popular locations and better matches
        CASE
          WHEN LOWER(a.name) = LOWER($1) THEN 1  -- Exact match
          WHEN LOWER(a.name) LIKE LOWER($1) || '%' THEN 2  -- Starts with
          WHEN a.is_popular = true THEN 3  -- Popular location
          ELSE 4  -- Other matches
        END as rank_priority
      FROM areas a
      JOIN locations m ON a.municipality_id = m.id AND m.type = 'municipality'
      JOIN locations d ON m.parent_id = d.id AND d.type = 'district'
      JOIN locations p ON d.parent_id = p.id AND p.type = 'province'
      WHERE
        a.name ILIKE $2
        OR a.name_np ILIKE $2
        OR to_tsvector('english', a.name || ' ' || COALESCE(a.name_np, '')) @@ plainto_tsquery('english', $1)
      ORDER BY
        rank_priority ASC,
        a.is_popular DESC,
        LENGTH(a.name) ASC,  -- Shorter names first
        a.name ASC
      LIMIT $3
    `;

    const result = await pool.query(query, [searchTerm, `%${searchTerm}%`, limit]);
    return result.rows;
  }

  /**
   * Get wards for a municipality
   */
  static async getWards(municipalityId) {
    // Get the municipality
    const municipalityQuery = `
      SELECT id, name, type
      FROM locations
      WHERE id = $1 AND type = 'municipality'
    `;

    const municipalityResult = await pool.query(municipalityQuery, [municipalityId]);

    if (municipalityResult.rows.length === 0) {
      return null;
    }

    // Get unique wards from areas table for this municipality
    const wardsQuery = `
      SELECT DISTINCT ward_number
      FROM areas
      WHERE municipality_id = $1 AND ward_number IS NOT NULL
      ORDER BY ward_number ASC
    `;

    const wardsResult = await pool.query(wardsQuery, [municipalityId]);

    const wards = wardsResult.rows.map(row => ({
      ward_number: row.ward_number,
      display_name: `Ward ${row.ward_number}`
    }));

    return {
      municipality: municipalityResult.rows[0],
      wards: wards
    };
  }

  /**
   * Get complete location hierarchy in a single query
   * Returns provinces with nested districts and municipalities
   * OPTIMIZED: Single database query instead of 85 separate queries
   */
  static async getHierarchy() {
    // Fetch all locations in one query
    const query = `
      SELECT
        id,
        name,
        type,
        parent_id
      FROM locations
      ORDER BY
        CASE type
          WHEN 'province' THEN 1
          WHEN 'district' THEN 2
          WHEN 'municipality' THEN 3
        END,
        id ASC
    `;

    const result = await pool.query(query);
    const allLocations = result.rows;

    // Build hierarchy in memory
    const provinces = allLocations.filter(loc => loc.type === 'province');
    const districts = allLocations.filter(loc => loc.type === 'district');
    const municipalities = allLocations.filter(loc => loc.type === 'municipality');

    // Create lookup maps for O(1) access
    const districtsByProvince = {};
    const municipalitiesByDistrict = {};

    // Group districts by province
    districts.forEach(district => {
      if (!districtsByProvince[district.parent_id]) {
        districtsByProvince[district.parent_id] = [];
      }
      districtsByProvince[district.parent_id].push({ ...district, municipalities: [] });
    });

    // Group municipalities by district
    municipalities.forEach(municipality => {
      if (!municipalitiesByDistrict[municipality.parent_id]) {
        municipalitiesByDistrict[municipality.parent_id] = [];
      }
      municipalitiesByDistrict[municipality.parent_id].push(municipality);
    });

    // Build final hierarchy
    const hierarchy = provinces.map(province => {
      const provinceDistricts = districtsByProvince[province.id] || [];

      // Attach municipalities to each district
      provinceDistricts.forEach(district => {
        district.municipalities = municipalitiesByDistrict[district.id] || [];
      });

      return {
        ...province,
        districts: provinceDistricts
      };
    });

    return hierarchy;
  }
}

module.exports = Location;