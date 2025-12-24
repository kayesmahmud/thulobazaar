import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { PAGINATION } from '../config/constants.js';
import { uploadAdImages } from '../middleware/upload.js';

const router = Router();

/**
 * GET /api/ads
 * Get all approved ads with filters
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      condition,
      sortBy = 'newest',
      limit = String(PAGINATION.DEFAULT_LIMIT),
      offset = '0',
    } = req.query;

    // Build where clause
    const where: any = {
      status: 'approved',
    };

    // Search filter
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category && category !== 'all' && !isNaN(Number(category))) {
      where.category_id = parseInt(category as string);
    }

    // Location filter
    if (location && location !== 'all' && !isNaN(Number(location))) {
      where.location_id = parseInt(location as string);
    }

    // Price filters
    if (minPrice && !isNaN(Number(minPrice))) {
      where.price = { ...(where.price || {}), gte: parseFloat(minPrice as string) };
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      where.price = { ...(where.price || {}), lte: parseFloat(maxPrice as string) };
    }

    // Condition filter
    if (condition && condition !== 'all') {
      where.condition = condition as string;
    }

    // Sorting - use reviewed_at for approved ads (when editor approved, not when user posted)
    // This ensures newly approved ads appear at the top, not ads that were pending for days
    let orderBy: any = { reviewed_at: 'desc' };
    if (sortBy === 'price-low') orderBy = { price: 'asc' };
    else if (sortBy === 'price-high') orderBy = { price: 'desc' };
    else if (sortBy === 'oldest') orderBy = { reviewed_at: 'asc' };

    const limitNum = Math.min(parseInt(limit as string) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const offsetNum = parseInt(offset as string) || 0;

    // Get ads with relations
    const [ads, total] = await Promise.all([
      prisma.ads.findMany({
        where,
        include: {
          categories: { select: { name: true, icon: true } },
          locations: { select: { name: true } },
          users_ads_user_idTousers: {
            select: {
              account_type: true,
              business_verification_status: true,
              individual_verified: true,
            },
          },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          },
        },
        orderBy,
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.ads.count({ where }),
    ]);

    // Transform to camelCase for frontend (per CLAUDE.md guidelines)
    const data = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      condition: ad.condition,
      status: ad.status,
      slug: ad.slug,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isUrgent: ad.is_urgent,
      isBumped: ad.is_bumped,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      categoryId: ad.category_id,
      locationId: ad.location_id,
      categoryName: ad.categories?.name,
      categoryIcon: ad.categories?.icon,
      locationName: ad.locations?.name,
      accountType: ad.users_ads_user_idTousers?.account_type,
      businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status,
      individualVerified: ad.users_ads_user_idTousers?.individual_verified,
      // publishedAt = when editor approved (use this for "time ago" display)
      publishedAt: ad.reviewed_at || ad.created_at,
      reviewedAt: ad.reviewed_at,
      primaryImage: ad.ad_images.find((img) => img.is_primary)?.filename || ad.ad_images[0]?.filename,
      images: ad.ad_images.map((img) => ({
        id: img.id,
        filename: img.filename,
        filePath: img.file_path,
        isPrimary: img.is_primary,
      })),
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    });
  })
);

/**
 * GET /api/ads/my-ads
 * Get current user's ads
 */
router.get(
  '/my-ads',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const ads = await prisma.ads.findMany({
      where: { user_id: userId },
      include: {
        categories: { select: { name: true, icon: true } },
        locations: { select: { name: true } },
        ad_images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform to camelCase for frontend (per CLAUDE.md guidelines)
    const data = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      condition: ad.condition,
      status: ad.status,
      slug: ad.slug,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isUrgent: ad.is_urgent,
      isBumped: ad.is_bumped,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      categoryId: ad.category_id,
      locationId: ad.location_id,
      categoryName: ad.categories?.name,
      categoryIcon: ad.categories?.icon,
      locationName: ad.locations?.name,
      primaryImage: ad.ad_images.find((img) => img.is_primary)?.filename || ad.ad_images[0]?.filename,
      images: ad.ad_images.map((img) => ({
        id: img.id,
        filename: img.filename,
        filePath: img.file_path,
        isPrimary: img.is_primary,
      })),
    }));

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * GET /api/ads/slug/:slug
 * Get ad by SEO slug
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const ad = await prisma.ads.findFirst({
      where: { slug },
      include: {
        categories: true,
        locations: true,
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            avatar: true,
            account_type: true,
            business_verification_status: true,
            individual_verified: true,
            shop_slug: true,
          },
        },
        ad_images: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
      },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    // Increment view count
    await prisma.ads.update({
      where: { id: ad.id },
      data: { view_count: { increment: 1 } },
    });

    res.json({
      success: true,
      data: {
        ...ad,
        category_name: (ad as any).categories?.name,
        location_name: (ad as any).locations?.name,
        seller: (ad as any).users_ads_user_idTousers,
        images: (ad as any).ad_images,
      },
    });
  })
);

/**
 * GET /api/ads/:id
 * Get ad by ID
 */
router.get(
  '/:id',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Try to find by ID or slug
    let ad: any;
    if (!isNaN(Number(id))) {
      ad = await prisma.ads.findUnique({
        where: { id: parseInt(id) },
        include: {
          categories: true,
          locations: true,
          users_ads_user_idTousers: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              avatar: true,
              account_type: true,
              business_verification_status: true,
              individual_verified: true,
              shop_slug: true,
            },
          },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          },
        },
      });
    } else {
      ad = await prisma.ads.findFirst({
        where: { slug: id },
        include: {
          categories: true,
          locations: true,
          users_ads_user_idTousers: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              avatar: true,
              account_type: true,
              business_verification_status: true,
              individual_verified: true,
              shop_slug: true,
            },
          },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
          },
        },
      });
    }

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    // Increment view count
    await prisma.ads.update({
      where: { id: ad.id },
      data: { view_count: { increment: 1 } },
    });

    res.json({
      success: true,
      data: {
        ...ad,
        category_name: ad.categories?.name,
        location_name: ad.locations?.name,
        seller: ad.users_ads_user_idTousers,
        images: ad.ad_images,
      },
    });
  })
);

/**
 * POST /api/ads
 * Create a new ad with images (multipart/form-data)
 */
router.post(
  '/',
  authenticateToken,
  uploadAdImages.array('images', 10), // Handle up to 10 images
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Frontend sends camelCase, map to snake_case for database
    const {
      title,
      description,
      price,
      categoryId,
      subcategoryId,
      locationId,
      isNegotiable,
      attributes, // JSON string containing condition and custom fields
    } = req.body;

    console.log('📥 Ad creation request - RAW BODY:', {
      userId,
      body: req.body,
      files: req.files ? (req.files as Express.Multer.File[]).length : 0,
    });

    console.log('📥 Parsed fields:', {
      title,
      categoryId,
      subcategoryId,
      locationId,
      attributes: attributes ? JSON.parse(attributes) : null,
    });

    // Validate required fields
    if (!title || !description || !categoryId) {
      throw new ValidationError('Title, description, and category are required');
    }

    // Parse attributes (contains condition and custom fields)
    let parsedAttributes: any = {};
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch (err) {
        console.error('❌ Failed to parse attributes:', err);
      }
    }

    // Extract condition and custom fields
    const condition = parsedAttributes.condition || 'used';
    const { condition: _cond, ...customFields } = parsedAttributes;

    // Generate SEO-friendly slug with "for-sale" pattern and sequential counter
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const titleSlug = slugify(title);

    // Get location name for slug
    let locationSlug = '';
    if (locationId) {
      const location = await prisma.locations.findUnique({
        where: { id: parseInt(locationId) },
        select: { name: true },
      });
      if (location?.name) {
        locationSlug = slugify(location.name);
      }
    }

    // Build base slug: title-for-sale-in-location
    // Example: "basket-ball-for-sale-in-anamnagar"
    const baseSlug = locationSlug
      ? `${titleSlug}-for-sale-in-${locationSlug}`
      : `${titleSlug}-for-sale`;

    // Find existing slugs with this base pattern to get highest counter
    const existingSlugs = await prisma.ads.findMany({
      where: {
        slug: {
          startsWith: `${baseSlug}-`,
        },
      },
      select: { slug: true },
    });

    // Extract counters and find the highest one
    let maxCounter = 0;
    const counterRegex = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);

    for (const ad of existingSlugs) {
      if (!ad.slug) continue;
      const match = ad.slug.match(counterRegex);
      if (match?.[1]) {
        const counter = parseInt(match[1], 10);
        if (counter > maxCounter) {
          maxCounter = counter;
        }
      }
    }

    // Use next sequential counter: baseSlug-1, baseSlug-2, etc.
    const slug = `${baseSlug}-${maxCounter + 1}`;

    // Create ad with pending status
    // Use subcategoryId if provided, otherwise use categoryId
    const finalCategoryId = subcategoryId ? parseInt(subcategoryId) : parseInt(categoryId);

    const ad = await prisma.ads.create({
      data: {
        title,
        description,
        price: price ? parseFloat(price) : null,
        category_id: finalCategoryId, // ✅ Use subcategory if provided
        location_id: locationId ? parseInt(locationId) : null,
        condition,
        user_id: userId,
        status: 'pending', // Goes to editor for review
        slug,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
      },
      include: {
        categories: true,
        locations: true,
      },
    });

    // Handle uploaded images
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const imageRecords = req.files.map((file: Express.Multer.File, index: number) => ({
        ad_id: ad.id,
        filename: file.filename,
        original_name: file.originalname,
        file_path: `/uploads/ads/${file.filename}`,
        file_size: file.size,
        mime_type: file.mimetype,
        is_primary: index === 0, // First image is primary
      }));

      await prisma.ad_images.createMany({
        data: imageRecords,
      });

      console.log(`✅ Uploaded ${req.files.length} images for ad ${ad.id}`);
    }

    console.log(`✅ Ad created: ${ad.title} (ID: ${ad.id}) by user ${userId} - Status: pending`);

    res.status(201).json({
      success: true,
      message: 'Ad created successfully. It will be reviewed by our team shortly.',
      data: ad,
    });
  })
);

/**
 * PUT /api/ads/:id
 * Update an ad
 */
router.put(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, description, price, category_id, location_id, condition } = req.body;

    // Check ownership
    const existingAd = await prisma.ads.findFirst({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to edit it');
    }

    const ad = await prisma.ads.update({
      where: { id: parseInt(id) },
      data: {
        title: title || existingAd.title,
        description: description || existingAd.description,
        price: price !== undefined ? parseFloat(price) : existingAd.price,
        category_id: category_id ? parseInt(category_id) : existingAd.category_id,
        location_id: location_id ? parseInt(location_id) : existingAd.location_id,
        condition: condition || existingAd.condition,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Ad updated: ${ad.title} (ID: ${ad.id})`);

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: ad,
    });
  })
);

/**
 * DELETE /api/ads/:id
 * Delete an ad
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check ownership
    const existingAd = await prisma.ads.findFirst({
      where: { id: parseInt(id), user_id: userId },
    });

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to delete it');
    }

    // Delete related images first
    await prisma.ad_images.deleteMany({
      where: { ad_id: parseInt(id) },
    });

    // Delete the ad
    await prisma.ads.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ Ad deleted: ${existingAd.title} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  })
);

export default router;
