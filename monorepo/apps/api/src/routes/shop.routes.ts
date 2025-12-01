import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { PAGINATION } from '../config/constants.js';

const router = Router();

/**
 * GET /api/shop/:slug
 * Get shop/seller page by slug
 */
router.get(
  '/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    // Find user by custom_shop_slug first, then shop_slug, then seller_slug
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { custom_shop_slug: slug },
          { shop_slug: slug },
          { seller_slug: slug },
        ],
      },
      select: {
        id: true,
        full_name: true,
        avatar: true,
        bio: true,
        account_type: true,
        shop_slug: true,
        custom_shop_slug: true,
        business_name: true,
        business_verification_status: true,
        individual_verified: true,
        created_at: true,
        locations: {
          select: { name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Shop not found');
    }

    const limitNum = Math.min(parseInt(limit as string), PAGINATION.MAX_LIMIT);
    const offsetNum = parseInt(offset as string);

    // Get seller's approved ads
    const [ads, totalAds] = await Promise.all([
      prisma.ads.findMany({
        where: { user_id: user.id, status: 'approved' },
        include: {
          categories: { select: { name: true } },
          locations: { select: { name: true } },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.ads.count({
        where: { user_id: user.id, status: 'approved' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        seller: {
          id: user.id,
          fullName: user.full_name,
          avatar: user.avatar,
          bio: user.bio,
          accountType: user.account_type,
          shopSlug: user.custom_shop_slug || user.shop_slug,
          businessName: user.business_name,
          businessVerificationStatus: user.business_verification_status,
          individualVerified: user.individual_verified,
          locationName: (user as any).locations?.name,
          memberSince: user.created_at,
        },
        ads: ads.map((ad: any) => ({
          ...ad,
          category_name: ad.categories?.name,
          location_name: ad.locations?.name,
          primary_image: ad.ad_images[0]?.filename,
        })),
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

/**
 * GET /api/shop/check-slug/:slug
 * Check if shop slug is available
 */
router.get(
  '/check-slug/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          { custom_shop_slug: slug },
          { shop_slug: slug },
          { seller_slug: slug },
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

export default router;
