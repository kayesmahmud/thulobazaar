const { Location } = require('../models');
const { NotFoundError } = require('../middleware/errorHandler');

class LocationController {
  /**
   * Get all locations
   */
  static async getAll(req, res) {
    const locations = await Location.findAllWithCount();

    console.log(`✅ Found ${locations.length} locations`);

    res.json({
      success: true,
      locations
    });
  }

  /**
   * Get single location
   */
  static async getOne(req, res) {
    const { id } = req.params;

    let location;
    if (!isNaN(id)) {
      location = await Location.findById(parseInt(id));
    } else {
      location = await Location.findBySlug(id);
    }

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.json({
      success: true,
      location
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
      location
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
      location
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
   * Get complete location hierarchy (provinces > districts > municipalities)
   * OPTIMIZED: Returns all locations in a single call instead of 85 separate calls
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
      )
    };

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

    console.log(`🔍 Location search for "${searchTerm}": Found ${results.length} results`);

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