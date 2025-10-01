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
}

module.exports = LocationController;