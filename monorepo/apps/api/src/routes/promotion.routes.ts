import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/promotions/pricing or /api/promotion-pricing
 * Get promotion pricing plans
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
