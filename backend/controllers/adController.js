const { Ad, AdImage } = require('../models');
const { NotFoundError, ValidationError, AuthenticationError } = require('../middleware/errorHandler');

class AdController {
  /**
   * Get all ads with filters
   */
  static async getAll(req, res) {
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
      sortBy = 'newest',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    console.log('🔍 API Call to /ads with params:', {
      search, category, location, minPrice, maxPrice,
      condition, datePosted, dateFrom, dateTo,
      sortBy, sortOrder, limit, offset
    });

    const { ads, total } = await Ad.findAll({
      search,
      category,
      location,
      minPrice,
      maxPrice,
      condition,
      datePosted,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get images for each ad
    const adsWithImages = await Promise.all(
      ads.map(async (ad) => {
        const images = await AdImage.findByAdId(ad.id);
        return { ...ad, images };
      })
    );

    console.log(`✅ Found ${ads.length} ads (${total} total)`);

    res.json({
      success: true,
      ads: adsWithImages,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  /**
   * Get single ad by ID or slug
   */
  static async getOne(req, res) {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let ad;
    if (!isNaN(id)) {
      ad = await Ad.findById(parseInt(id));
    }

    if (!ad) {
      ad = await Ad.findBySlug(id);
    }

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    // Get images
    const images = await AdImage.findByAdId(ad.id);

    // Increment view count (don't await to avoid blocking)
    Ad.incrementViews(ad.id).catch(err => {
      console.error('Error incrementing view count:', err);
    });

    console.log(`✅ Found ad: ${ad.title} with ${images.length} images`);

    res.json({
      success: true,
      ad: { ...ad, images }
    });
  }

  /**
   * Create new ad
   */
  static async create(req, res) {
    const {
      title,
      description,
      price,
      condition,
      categoryId,
      locationId,
      sellerName,
      sellerPhone
    } = req.body;

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();

    // Create ad
    const ad = await Ad.create({
      title,
      description,
      price,
      condition,
      categoryId,
      locationId,
      sellerName,
      sellerPhone,
      userId: req.user.userId,
      slug
    });

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/uploads/${req.files[i].filename}`;
        await AdImage.create({
          adId: ad.id,
          imageUrl,
          isPrimary: i === 0 // First image is primary
        });
      }
    }

    // Get ad with images
    const images = await AdImage.findByAdId(ad.id);

    console.log(`✅ Created ad: ${ad.title} with ${images.length} images`);

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      ad: { ...ad, images }
    });
  }

  /**
   * Update ad
   */
  static async update(req, res) {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      condition,
      categoryId,
      locationId,
      sellerName,
      sellerPhone
    } = req.body;

    // Check if ad exists
    const existingAd = await Ad.findById(id);
    if (!existingAd) {
      throw new NotFoundError('Ad not found');
    }

    // Check ownership
    const isOwner = await Ad.isOwner(id, req.user.userId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AuthenticationError('You do not have permission to update this ad');
    }

    // Generate new slug if title changed
    let slug = existingAd.slug;
    if (title && title !== existingAd.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();
    }

    // Update ad
    const ad = await Ad.update(id, {
      title,
      description,
      price,
      condition,
      categoryId,
      locationId,
      sellerName,
      sellerPhone,
      slug
    });

    // Get images
    const images = await AdImage.findByAdId(ad.id);

    console.log(`✅ Updated ad: ${ad.title}`);

    res.json({
      success: true,
      message: 'Ad updated successfully',
      ad: { ...ad, images }
    });
  }

  /**
   * Delete ad
   */
  static async delete(req, res) {
    const { id } = req.params;

    // Check if ad exists
    const ad = await Ad.findById(id);
    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    // Check ownership
    const isOwner = await Ad.isOwner(id, req.user.userId);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AuthenticationError('You do not have permission to delete this ad');
    }

    // Delete ad images first
    await AdImage.deleteByAdId(id);

    // Delete ad
    await Ad.delete(id);

    console.log(`✅ Deleted ad ID: ${id}`);

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });
  }

  /**
   * Get user's own ads
   */
  static async getMyAds(req, res) {
    const { limit = 20, offset = 0, status } = req.query;

    const { ads, total } = await Ad.findAll({
      userId: req.user.userId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get images for each ad
    const adsWithImages = await Promise.all(
      ads.map(async (ad) => {
        const images = await AdImage.findByAdId(ad.id);
        return { ...ad, images };
      })
    );

    res.json({
      success: true,
      ads: adsWithImages,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  }

  /**
   * Update ad status (admin only)
   */
  static async updateStatus(req, res) {
    const { id } = req.params;
    const { status, reason } = req.body;

    const ad = await Ad.findById(id);
    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await Ad.updateStatus(id, status);

    console.log(`✅ Updated ad ${id} status to: ${status}`);

    res.json({
      success: true,
      message: `Ad ${status} successfully`,
      reason
    });
  }

  /**
   * Toggle featured status (admin only)
   */
  static async toggleFeatured(req, res) {
    const { id } = req.params;

    const ad = await Ad.findById(id);
    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    const result = await Ad.toggleFeatured(id);

    res.json({
      success: true,
      message: `Ad ${result.is_featured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured: result.is_featured
    });
  }
}

module.exports = AdController;