import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
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
      where.condition = condition;
    }

    const [ads, total] = await Promise.all([
      prisma.ads.findMany({
        where,
        include: {
          categories: { select: { name: true } },
          locations: { select: { name: true } },
          users_ads_user_idTousers: {
            select: {
              account_type: true,
              business_verification_status: true,
              individual_verified: true,
            },
          },
          ad_images: {
            orderBy: [{ is_primary: 'desc' }],
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        take: limitNum,
        skip: offsetNum,
      }),
      prisma.ads.count({ where }),
    ]);

    const data = ads.map((ad: any) => ({
      ...ad,
      category_name: ad.categories?.name,
      location_name: ad.locations?.name,
      account_type: ad.users_ads_user_idTousers?.account_type,
      business_verification_status: ad.users_ads_user_idTousers?.business_verification_status,
      individual_verified: ad.users_ads_user_idTousers?.individual_verified,
      primary_image: ad.ad_images[0]?.filename,
    }));

    console.log(`🔍 Search for "${searchTerm}": Found ${total} results`);

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
