import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/promotion-pricing (root route)
 * Get all active promotion pricing with tier support
 *
 * Query params:
 * - tier: Filter by pricing tier (optional)
 * - adId: Ad ID to determine tier from ad's category (optional)
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { tier, adId } = req.query;

    // If adId is provided, determine tier from ad's category
    let adPricingTier = 'default';
    if (adId) {
      const ad = await prisma.ads.findUnique({
        where: { id: parseInt(adId as string, 10) },
        select: {
          category_id: true,
          categories: {
            select: {
              id: true,
              name: true,
              categories: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (ad?.categories) {
        // Get the parent category ID (or current if it's a root category)
        const parentCategoryId = ad.categories.categories?.id || ad.categories.id;

        // Look up tier mapping by category_id
        const tierMapping = await prisma.category_pricing_tiers.findFirst({
          where: {
            category_id: parentCategoryId,
          },
          select: { pricing_tier: true },
        });

        if (tierMapping) {
          adPricingTier = tierMapping.pricing_tier;
        }
      }
    }

    // Build where clause
    const whereClause: Record<string, unknown> = { is_active: true };
    if (tier && VALID_TIERS.includes(tier as string)) {
      whereClause.pricing_tier = tier;
    }

    // Fetch all active promotion pricing
    const pricing = await prisma.promotion_pricing.findMany({
      where: whereClause,
      select: {
        id: true,
        promotion_type: true,
        duration_days: true,
        account_type: true,
        pricing_tier: true,
        price: true,
        discount_percentage: true,
        is_active: true,
      },
      orderBy: [
        { pricing_tier: 'asc' },
        { promotion_type: 'asc' },
        { duration_days: 'asc' },
        { account_type: 'desc' },
      ],
    });

    // Group by tier, then by promotion type and duration
    const pricingByTier: Record<string, Record<string, Record<number, Record<string, unknown>>>> = {};
    const pricingMap: Record<string, Record<number, Record<string, unknown>>> = {};

    pricing.forEach((row) => {
      const pricingTier = row.pricing_tier || 'default';
      const promotionType = row.promotion_type || 'unknown';
      const durationDays = row.duration_days || 0;
      const accountType = row.account_type || 'individual';

      const priceData = {
        id: row.id,
        price: parseFloat(row.price.toString()),
        discountPercentage: row.discount_percentage,
      };

      // Group by tier
      if (!pricingByTier[pricingTier]) {
        pricingByTier[pricingTier] = {};
      }
      if (!pricingByTier[pricingTier][promotionType]) {
        pricingByTier[pricingTier][promotionType] = {};
      }
      if (!pricingByTier[pricingTier][promotionType][durationDays]) {
        pricingByTier[pricingTier][promotionType][durationDays] = {};
      }
      pricingByTier[pricingTier][promotionType][durationDays][accountType] = priceData;

      // Backwards compatible format (default tier only)
      if (pricingTier === 'default') {
        if (!pricingMap[promotionType]) {
          pricingMap[promotionType] = {};
        }
        if (!pricingMap[promotionType][durationDays]) {
          pricingMap[promotionType][durationDays] = {};
        }
        pricingMap[promotionType][durationDays][accountType] = priceData;
      }
    });

    // Transform raw data to camelCase
    const transformedRaw = pricing.map((p) => ({
      id: p.id,
      promotionType: p.promotion_type,
      durationDays: p.duration_days,
      accountType: p.account_type,
      pricingTier: p.pricing_tier,
      price: parseFloat(p.price.toString()),
      discountPercentage: p.discount_percentage,
      isActive: p.is_active,
    }));

    // If adId was provided, include ad-specific pricing using its tier
    let adPricing: Record<string, Record<number, Record<string, unknown>>> | null = null;
    if (adId && pricingByTier[adPricingTier]) {
      adPricing = pricingByTier[adPricingTier];
    }

    res.json({
      success: true,
      data: {
        pricing: pricingMap, // Backwards compatible (default tier)
        pricingByTier, // New: grouped by tier
        tiers: VALID_TIERS,
        raw: transformedRaw,
        // Ad-specific data when adId is provided
        adPricingTier: adId ? adPricingTier : undefined,
        adPricing: adPricing || pricingMap, // Use ad's tier pricing or fallback to default
      },
    });
  })
);

/**
 * GET /api/promotions/pricing or /api/promotion-pricing/pricing
 * Get promotion pricing plans (simple format)
 */
router.get(
  '/pricing',
  catchAsync(async (_req: Request, res: Response) => {
    // Get pricing from database
    const plans = await prisma.promotion_pricing.findMany({
      where: { is_active: true },
      orderBy: [{ promotion_type: 'asc' }, { duration_days: 'asc' }],
    });

    res.json({
      success: true,
      data: plans,
    });
  })
);

/**
 * GET /api/promotions/my-promotions
 * Get current user's active promotions
 */
router.get(
  '/my-promotions',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const promotions = await prisma.ad_promotions.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() },
      },
      include: {
        ads: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { expires_at: 'desc' },
    });

    res.json({
      success: true,
      data: promotions,
    });
  })
);

/**
 * POST /api/promotions
 * Create a promotion for an ad
 */
router.post(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { adId, promotionType, durationDays, paymentReference } = req.body;

    // Verify ad ownership
    const ad = await prisma.ads.findFirst({
      where: { id: parseInt(adId), user_id: userId },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found or you do not have permission');
    }

    // Get user info for account type
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { account_type: true },
    });

    // Get pricing
    const pricing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: durationDays || 7,
        account_type: user?.account_type || 'individual',
        is_active: true,
      },
    });

    const pricePaid = pricing?.price || 0;
    const duration = durationDays || 7;
    const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    const promotion = await prisma.ad_promotions.create({
      data: {
        ad_id: parseInt(adId),
        user_id: userId,
        promotion_type: promotionType,
        duration_days: duration,
        price_paid: pricePaid,
        account_type: user?.account_type || 'individual',
        payment_reference: paymentReference || null,
        starts_at: new Date(),
        expires_at: expiresAt,
      },
    });

    // Update ad flags based on promotion type
    const updateData: any = {};
    if (promotionType === 'featured') {
      updateData.is_featured = true;
      updateData.featured_until = expiresAt;
    }
    if (promotionType === 'urgent') {
      updateData.is_urgent = true;
      updateData.urgent_until = expiresAt;
    }
    if (promotionType === 'bump') {
      updateData.is_bumped = true;
      updateData.bump_expires_at = expiresAt;
      updateData.promoted_at = new Date();
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.ads.update({
        where: { id: parseInt(adId) },
        data: updateData,
      });
    }

    console.log(`✅ Promotion created: ${promotionType} for ad ${adId}`);

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion,
    });
  })
);

// ============================================
// ADMIN PRICING MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/promotion-pricing/admin/all
 * Get all promotion pricing (admin only)
 */
router.get(
  '/admin/all',
  catchAsync(async (_req: Request, res: Response) => {
    const pricings = await prisma.promotion_pricing.findMany({
      orderBy: [
        { pricing_tier: 'asc' },
        { promotion_type: 'asc' },
        { duration_days: 'asc' },
        { account_type: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: { raw: pricings },
    });
  })
);

/**
 * POST /api/promotion-pricing/admin/create
 * Create new promotion pricing (admin only)
 */
router.post(
  '/admin/create',
  catchAsync(async (req: Request, res: Response) => {
    const { promotion_type, duration_days, account_type, pricing_tier, price, discount_percentage } = req.body;

    // Check if pricing already exists for this combination
    const existing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type,
        duration_days: parseInt(duration_days),
        account_type,
        pricing_tier: pricing_tier || 'default',
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Pricing for this combination already exists',
      });
    }

    const pricing = await prisma.promotion_pricing.create({
      data: {
        promotion_type,
        duration_days: parseInt(duration_days),
        account_type,
        pricing_tier: pricing_tier || 'default',
        price: parseFloat(price),
        discount_percentage: parseInt(discount_percentage) || 0,
        is_active: true,
      },
    });

    console.log(`✅ Created promotion pricing: ${promotion_type} ${duration_days}d ${account_type} ${pricing_tier}`);

    res.status(201).json({
      success: true,
      data: pricing,
    });
  })
);

/**
 * PUT /api/promotion-pricing/admin/:id
 * Update promotion pricing (admin only)
 */
router.put(
  '/admin/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { price, discount_percentage, is_active } = req.body;

    const pricing = await prisma.promotion_pricing.update({
      where: { id: parseInt(id) },
      data: {
        price: parseFloat(price),
        discount_percentage: discount_percentage !== undefined ? parseInt(discount_percentage) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Updated promotion pricing ID: ${id}`);

    res.json({
      success: true,
      data: pricing,
    });
  })
);

/**
 * DELETE /api/promotion-pricing/admin/:id
 * Deactivate promotion pricing (admin only)
 */
router.delete(
  '/admin/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const pricing = await prisma.promotion_pricing.update({
      where: { id: parseInt(id) },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Deactivated promotion pricing ID: ${id}`);

    res.json({
      success: true,
      data: pricing,
    });
  })
);

/**
 * GET /api/promotions/:id
 * Get promotion details
 */
router.get(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const promotion = await prisma.ad_promotions.findUnique({
      where: { id: parseInt(id) },
      include: {
        ads: {
          select: {
            id: true,
            title: true,
            user_id: true,
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundError('Promotion not found');
    }

    res.json({
      success: true,
      data: promotion,
    });
  })
);

export default router;
