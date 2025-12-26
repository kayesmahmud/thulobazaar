import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/promotion-pricing
 * Get all active promotion pricing (public endpoint)
 *
 * Query params:
 * - tier: Filter by pricing tier (optional)
 * - adId: Ad ID to determine tier from ad's category (optional)
 * - all: Include all tiers (default: true for admin, false returns only default tier)
 *
 * Returns pricing grouped by tier, promotion type and duration for easy frontend consumption
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const adId = searchParams.get('adId');
    const includeAll = searchParams.get('all') !== 'false';

    // If adId is provided, determine tier from ad's category
    let adPricingTier = 'default';
    if (adId) {
      const ad = await prisma.ads.findUnique({
        where: { id: parseInt(adId, 10) },
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
    if (tier && VALID_TIERS.includes(tier)) {
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
    // Structure: { tier: { promotionType: { duration: { accountType: {...} } } } }
    const pricingByTier: Record<string, Record<string, Record<number, Record<string, unknown>>>> = {};

    // Also maintain the old format for backwards compatibility (default tier only)
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

      // Also keep backwards compatible format (default tier only)
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

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Promotion pricing fetch error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch promotion pricing',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotion-pricing
 * Create new promotion pricing entry
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - promotion_type: 'featured' | 'urgent' | 'sticky' (required)
 * - duration_days: number (required)
 * - account_type: 'individual' | 'individual_verified' | 'business' (required)
 * - pricing_tier: 'default' | 'electronics' | 'vehicles' | 'property' (optional, default: 'default')
 * - price: number (required)
 * - discount_percentage: number (optional, default: 0)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { promotion_type, duration_days, account_type, pricing_tier, price, discount_percentage } = body;

    // Validate required fields
    if (!promotion_type || !duration_days || !account_type || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Promotion type, duration, account type, and price are required',
        },
        { status: 400 }
      );
    }

    // Validate promotion type
    const validPromotionTypes = ['featured', 'urgent', 'sticky'];
    if (!validPromotionTypes.includes(promotion_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid promotion type. Must be: featured, urgent, or sticky',
        },
        { status: 400 }
      );
    }

    // Validate account type
    if (!['individual', 'individual_verified', 'business'].includes(account_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid account type. Must be: individual, individual_verified, or business',
        },
        { status: 400 }
      );
    }

    // Validate pricing tier
    const tier = pricing_tier || 'default';
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid pricing tier. Must be: default, electronics, vehicles, or property',
        },
        { status: 400 }
      );
    }

    // Create promotion pricing
    const newPricing = await prisma.promotion_pricing.create({
      data: {
        promotion_type,
        duration_days: parseInt(duration_days, 10),
        account_type,
        pricing_tier: tier,
        price: parseFloat(price),
        discount_percentage: discount_percentage || 0,
        is_active: true,
      },
    });

    console.log(`✅ Promotion pricing created by editor ${editor.userId}:`, newPricing);

    return NextResponse.json(
      {
        success: true,
        message: 'Promotion pricing created successfully',
        data: {
          id: newPricing.id,
          promotionType: newPricing.promotion_type,
          durationDays: newPricing.duration_days,
          accountType: newPricing.account_type,
          pricingTier: newPricing.pricing_tier,
          price: parseFloat(newPricing.price.toString()),
          discountPercentage: newPricing.discount_percentage,
          isActive: newPricing.is_active,
          createdAt: newPricing.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    console.error('Promotion pricing creation error:', err);

    if (err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (err.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 403 }
      );
    }

    // Check for unique constraint violation
    if (err.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: 'Pricing for this combination already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create promotion pricing',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
