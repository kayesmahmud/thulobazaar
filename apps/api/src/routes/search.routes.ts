import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { publicVerification } from '@thulobazaar/types';
import { catchAsync } from '../middleware/errorHandler.js';
import { PAGINATION } from '../config/constants.js';

const router = Router();

/**
 * GET /api/search
 * Search ads (can be extended to use Typesense)
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const {
      q,
      category,
      location,
      minPrice,
      maxPrice,
      condition,
      limit = '20',
      offset = '0',
    } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, limit: parseInt(limit as string), offset: 0, hasMore: false },
      });
    }

    const searchTerm = (q as string).trim();
    const limitNum = Math.min(parseInt(limit as string), PAGINATION.MAX_LIMIT);
    const offsetNum = parseInt(offset as string);

    // Build where clause
    const where: any = {
      status: 'approved',
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (category && category !== 'all' && !isNaN(Number(category))) {
      where.category_id = parseInt(category as string);
    }

    if (location && location !== 'all' && !isNaN(Number(location))) {
      where.location_id = parseInt(location as string);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      where.price = { ...where.price, gte: parseFloat(minPrice as string) };
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      where.price = { ...where.price, lte: parseFloat(maxPrice as string) };
    }

    if (condition && condition !== 'all') {
      const c = (condition as string).toLowerCase();
      if (c === 'new' || c === 'brand new') {
        where.condition = 'Brand New';
      } else {
        where.condition = 'Used';
      }
    }

    const [ads, total] = await Promise.all([
      prisma.ads.findMany({
        where,
        include: {
          categories: { select: { name: true, name_ne: true } },
          locations: { select: { name: true, name_ne: true } },
          users_ads_user_idTousers: {
            select: {
              account_type: true,
              business_verification_status: true,
              individual_verified: true,
              is_suspended: true,
              is_active: true,
            },
          },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }],
            take: 1,
          },
        },
        orderBy: { published_at: { sort: 'desc', nulls: 'last' } }, // Sort by first-publish time, nulls last
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.ads.count({ where }),
    ]);

    const data = ads.map((ad: any) => {
      // 🔒 DB-M1: strip internal moderation columns from the public spread.
      const { status_reason, reviewed_by, deleted_by, deletion_reason, ...safeAd } = ad;
      return {
      ...safeAd,
      category_name: ad.categories?.name,
      category_name_ne: ad.categories?.name_ne,
      location_name: ad.locations?.name,
      location_name_ne: ad.locations?.name_ne,
      account_type: ad.users_ads_user_idTousers?.account_type,
      // Suspended/deactivated sellers show no badge (publicVerification)
      business_verification_status: publicVerification(ad.users_ads_user_idTousers).businessVerificationStatus,
      individual_verified: publicVerification(ad.users_ads_user_idTousers).individualVerified,
      primary_image: ad.ad_images[0]?.filename,
      // publishedAt = first time the ad went live (use for "time ago" display);
      // re-approvals after owner edits don't move it
      publishedAt: ad.published_at || ad.reviewed_at || ad.created_at,
      reviewedAt: ad.published_at || ad.reviewed_at,
      };
    });

    // Short-lived cache — search results change as ads are approved/expired
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
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

export default router;
