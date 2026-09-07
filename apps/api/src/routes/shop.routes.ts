import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { publicVerification } from '@thulobazaar/types';
import { catchAsync, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { PAGINATION } from '../config/constants.js';

const router = Router();

/**
 * GET /api/shop/check-slug/:slug
 * Check if shop slug is available
 * NOTE: Must be defined BEFORE /:slug to avoid route collision
 */
router.get(
  '/check-slug/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const slug = String(req.params.slug);

    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { custom_shop_slug: slug },
          { shop_slug: slug },
        ],
      },
    });

    res.json({
      success: true,
      data: {
        available: !existing,
        slug,
      },
    });
  })
);

/**
 * PUT /api/shop/update-slug
 * Update custom shop slug (requires authentication)
 */
router.put(
  '/update-slug',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      throw new ValidationError('User not authenticated');
    }

    const { slug: rawSlug } = req.body;
    if (!rawSlug || typeof rawSlug !== 'string') {
      throw new ValidationError('Slug is required');
    }

    // Normalize slug: trim, lowercase, remove invalid characters
    const slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Validate slug length (3-50 chars)
    if (slug.length < 3) {
      throw new ValidationError('Shop URL must be at least 3 characters');
    }
    if (slug.length > 50) {
      throw new ValidationError('Shop URL must be 50 characters or less');
    }

    // Check if slug is available (not used by another user)
    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { custom_shop_slug: slug },
          { shop_slug: slug },
        ],
        NOT: { id: userId },
      },
    });

    if (existing) {
      throw new ValidationError('This shop URL is already taken');
    }

    // Update the user's custom shop slug
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { custom_shop_slug: slug },
      select: {
        custom_shop_slug: true,
        shop_slug: true,
      },
    });

    res.json({
      success: true,
      data: {
        shopSlug: updatedUser.custom_shop_slug || updatedUser.shop_slug,
      },
    });
  })
);

/**
 * GET /api/shop/:slug
 * Get shop/seller page by slug
 */
router.get(
  '/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const slug = String(req.params.slug);
    const { limit = '20', offset = '0' } = req.query;

    // Find user by custom_shop_slug, shop_slug, or user-{id} fallback
    const userIdMatch = slug.match(/^user-(\d+)$/);
    const user = await prisma.users.findFirst({
      where: {
        // Staff accounts (editors/admins) are moderators, not sellers — no shop page
        NOT: { role: { in: ['editor', 'super_admin'] } },
        ...(userIdMatch
          ? { id: parseInt(userIdMatch[1], 10) }
          : {
              OR: [
                { custom_shop_slug: slug },
                { shop_slug: slug },
              ],
            }),
      },
      select: {
        id: true,
        full_name: true,
        avatar: true,
        cover_photo: true,
        bio: true,
        business_description: true,
        account_type: true,
        shop_slug: true,
        custom_shop_slug: true,
        business_name: true,
        phone: true,
        business_phone: true,
        business_website: true,
        google_maps_link: true,
        business_verification_status: true,
        individual_verified: true,
        is_active: true,
        is_suspended: true,
        facebook_url: true,
        instagram_url: true,
        tiktok_url: true,
        created_at: true,
        location_id: true,
        default_category_id: true,
        default_subcategory_id: true,
        locations: {
          select: { name: true, slug: true },
        },
        default_category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        default_subcategory: {
          select: { id: true, name: true, slug: true, icon: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Shop not found');
    }

    const limitNum = Math.min(parseInt(limit as string), PAGINATION.MAX_LIMIT);
    const offsetNum = parseInt(offset as string);

    // Get seller's approved ads + aggregate stats in parallel.
    // Single aggregate call returns both totalAds (count) and totalViews (sum of view_count)
    // across ALL approved ads — not just the current page.
    const [ads, statsAgg] = await Promise.all([
      prisma.ads.findMany({
        where: { user_id: user.id, status: 'approved' },
        include: {
          categories: { select: { name: true, name_ne: true } },
          locations: { select: { name: true, name_ne: true } },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
            take: 1,
          },
        },
        orderBy: [
          // Match the website shop page ordering: promotions first (Urgent >
          // Sticky), then newest-approved. Featured is homepage-only, not pinned.
          { is_urgent: 'desc' },
          { is_sticky: 'desc' },
          { published_at: { sort: 'desc', nulls: 'last' } },
        ],
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.ads.aggregate({
        where: { user_id: user.id, status: 'approved' },
        _count: { _all: true },
        _sum: { view_count: true },
      }),
    ]);

    const totalAds = statsAgg._count._all;
    const totalViews = statsAgg._sum.view_count ?? 0;

    res.json({
      success: true,
      data: {
        seller: {
          id: user.id,
          fullName: user.full_name,
          avatar: user.avatar,
          coverPhoto: user.cover_photo,
          bio: user.bio,
          businessDescription: user.business_description,
          accountType: user.account_type,
          shopSlug: user.custom_shop_slug || user.shop_slug,
          businessName: user.business_name,
          phone: user.phone,
          businessPhone: user.business_phone,
          businessWebsite: user.business_website,
          googleMapsLink: user.google_maps_link,
          email: '', // Don't expose email publicly
          // Suspended/deactivated accounts show no badge (publicVerification)
          ...publicVerification(user),
          locationId: (user as any).location_id,
          locationName: (user as any).locations?.name,
          locationFullPath: (user as any).locations?.slug,
          categoryId: (user as any).default_category_id,
          categoryName: (user as any).default_category?.name,
          categorySlug: (user as any).default_category?.slug,
          categoryIcon: (user as any).default_category?.icon,
          subcategoryId: (user as any).default_subcategory_id,
          subcategoryName: (user as any).default_subcategory?.name,
          subcategorySlug: (user as any).default_subcategory?.slug,
          subcategoryIcon: (user as any).default_subcategory?.icon,
          facebookUrl: user.facebook_url,
          instagramUrl: user.instagram_url,
          tiktokUrl: user.tiktok_url,
          memberSince: user.created_at,
          totalAds,
          totalViews,
        },
        ads: ads.map((ad: any) => {
          // 🔒 DB-M1: strip internal moderation columns from the public spread.
          const { status_reason, reviewed_by, deleted_by, deletion_reason, ...safeAd } = ad;
          return {
            ...safeAd,
            category_name: ad.categories?.name,
            category_name_ne: ad.categories?.name_ne,
            location_name: ad.locations?.name,
            location_name_ne: ad.locations?.name_ne,
            primary_image: ad.ad_images[0]?.filename,
            // Same display-time contract as /api/ads and /api/search: the
            // stable first-publish time, not the last moderation stamp.
            publishedAt: ad.published_at || ad.reviewed_at || ad.created_at,
            reviewedAt: ad.published_at || ad.reviewed_at,
          };
        }),
        pagination: {
          total: totalAds,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalAds,
        },
      },
    });
  })
);

export default router;
