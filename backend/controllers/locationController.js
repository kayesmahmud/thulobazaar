const { Location } = require('../models');
const { NotFoundError } = require('../middleware/errorHandler');

class LocationController {
  /**
   * Get all locations (with optional parent_id or type filter for hierarchical selection)
   */
  static async getAll(req, res) {
    const { parent_id, type } = req.query;

    let locations;

    if (type !== undefined) {
      // Filter by location type (province, district, municipality, etc.)
      const query = `
        SELECT l.*, COUNT(a.id) as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
        WHERE l.type = $1
        GROUP BY l.id
        ORDER BY l.name ASC
      `;
      const result = await require('../config/database').query(query, [type]);
      locations = result.rows;
      console.log(`✅ Found ${locations.length} locations (type: ${type})`);
    } else if (parent_id !== undefined) {
      // Fetch children of specific parent (or provinces if parent_id is null/empty)
      if (parent_id === '' || parent_id === 'null') {
        // Get top-level locations (provinces)
        const query = `
          SELECT l.*, COUNT(a.id) as ad_count
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
          WHERE l.parent_id IS NULL
          GROUP BY l.id
          ORDER BY l.name ASC
        `;
        const result = await require('../config/database').query(query);
        locations = result.rows;
      } else {
        // Get children of specific parent
        const query = `
          SELECT l.*, COUNT(a.id) as ad_count
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
          WHERE l.parent_id = $1
          GROUP BY l.id
          ORDER BY l.name ASC
        `;
        const result = await require('../config/database').query(query, [parseInt(parent_id)]);
        locations = result.rows;
      }
      console.log(`✅ Found ${locations.length} locations (parent_id: ${parent_id || 'NULL'})`);
    } else {
      // Fetch all locations (backward compatibility)
      locations = await Location.findAllWithCount();
      console.log(`✅ Found ${locations.length} locations`);
    }

    res.json({
      success: true,
      data: locations
    });
  }

  /**
   * Get single location
   */
  static async getOne(req, res) {
    const { id, slug } = req.params;
    const identifier = slug || id;

    let location;
    if (!isNaN(identifier)) {
      location = await Location.findById(parseInt(identifier));
    } else {
      location = await Location.findBySlug(identifier);
    }

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.json({
      success: true,
      data: location
    });
  }

  /**
   * Create location (admin only)
   */
  static async create(req, res) {
    const { name, latitude, longitude } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const location = await Location.create({
      name,
      slug,
      latitude,
      longitude
    });

    console.log(`✅ Created location: ${location.name}`);

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  }

  /**
   * Update location (admin only)
   */
  static async update(req, res) {
    const { id } = req.params;
    const { name, latitude, longitude } = req.body;

    const existingLocation = await Location.findById(id);
    if (!existingLocation) {
      throw new NotFoundError('Location not found');
    }

    let slug = existingLocation.slug;
    if (name && name !== existingLocation.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const location = await Location.update(id, {
      name,
      slug,
      latitude,
      longitude
    });

    console.log(`✅ Updated location: ${location.name}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  }

  /**
   * Delete location (admin only)
   */
  static async delete(req, res) {
    const { id } = req.params;

    const location = await Location.findById(id);
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    await Location.delete(id);

    console.log(`✅ Deleted location: ${location.name}`);

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  }

  /**
   * Get complete location hierarchy (provinces > districts > municipalities > wards > areas)
   * OPTIMIZED: Returns all locations in a single call instead of hundreds of separate calls
   */
  static async getHierarchy(req, res) {
    const hierarchy = await Location.getHierarchy();

    const stats = {
      provinces: hierarchy.length,
      districts: hierarchy.reduce((sum, p) => sum + p.districts.length, 0),
      municipalities: hierarchy.reduce((sum, p) =>
        sum + p.districts.reduce((districtSum, d) =>
          districtSum + d.municipalities.length, 0
        ), 0
      ),
      wards: hierarchy.reduce((sum, p) =>
        sum + p.districts.reduce((districtSum, d) =>
          districtSum + d.municipalities.reduce((munSum, m) =>
            munSum + (m.wards?.length || 0), 0
          ), 0
        ), 0
      ),
      areas: hierarchy.reduce((sum, p) =>
        sum + p.districts.reduce((districtSum, d) =>
          districtSum + d.municipalities.reduce((munSum, m) =>
            munSum + (m.wards || []).reduce((wardSum, w) =>
              wardSum + (w.areas?.length || 0), 0
            ), 0
          ), 0
        ), 0
      )
    };

    console.log('📍 Location hierarchy stats:', stats);

    res.json({
      success: true,
      data: hierarchy,
      stats
    });
  }

  /**
   * Search areas/places with autocomplete
   */
  static async searchAreas(req, res) {
    const { q, limit = 10 } = req.query;

    // Return empty if query is too short
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = q.trim();
    const results = await Location.searchAreas(searchTerm, parseInt(limit));

    console.log(`🔍 Area search for "${searchTerm}": Found ${results.length} results`);

    res.json({
      success: true,
      data: results
    });
  }

  /**
   * Search ALL location levels (provinces, districts, municipalities, wards, areas)
   */
  static async searchAllLocations(req, res) {
    const { q, limit = 15 } = req.query;

    // Return empty if query is too short
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchTerm = q.trim();
    const results = await Location.searchAllLocations(searchTerm, parseInt(limit));

    console.log(`🔍 All-location search for "${searchTerm}": Found ${results.length} results`);

    res.json({
      success: true,
      data: results
    });
  }

  /**
   * Get wards for a municipality
   */
  static async getWards(req, res) {
    const { id } = req.params;

    const result = await Location.getWards(parseInt(id));

    if (!result) {
      throw new NotFoundError('Municipality not found');
    }

    res.json({
      success: true,
      data: result
    });
  }
}

module.exports = LocationController;