const { Ad, AdImage } = require('../models');
const { NotFoundError, ValidationError, AuthenticationError } = require('../middleware/errorHandler');
const { generateSlug } = require('../utils/slugUtils');
const { PAGINATION } = require('../config/constants');

class AdController {
  /**
   * Get all ads with filters
   */
  static async getAll(req, res) {
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
      sortBy = 'newest',
      sortOrder = 'desc',
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = PAGINATION.DEFAULT_OFFSET
    } = req.query;

    console.log('🔍🔍🔍 FULL REQ.QUERY:', JSON.stringify(req.query));
    console.log('🔍 API Call to /ads with params:', {
      search, category, parentCategoryId, location, minPrice, maxPrice,
      condition, datePosted, dateFrom, dateTo,
      sortBy, sortOrder, limit, offset
    });

    const { ads, total } = await Ad.findAll({
      search,
      category,
      parentCategoryId: parentCategoryId ? parseInt(parentCategoryId) : undefined,
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

    // Images are now included in the ads result from the optimized query
    console.log(`✅ Found ${ads.length} ads (${total} total)`);

    res.json({
      success: true,
      data: ads,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        totalPages: Math.ceil(total / parseInt(limit))
      }
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

    // Generate unique slug from title
    const slug = await generateSlug(title);

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
      slug = await generateSlug(title, id);
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
    const { limit = PAGINATION.DEFAULT_LIMIT, offset = PAGINATION.DEFAULT_OFFSET, status } = req.query;

    const { ads, total } = await Ad.findAll({
      userId: req.user.userId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Images are now included in the ads result from the optimized query
    res.json({
      success: true,
      data: ads,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        totalPages: Math.ceil(total / parseInt(limit))
      }
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