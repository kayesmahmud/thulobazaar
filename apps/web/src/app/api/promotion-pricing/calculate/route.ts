import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/promotion-pricing/calculate
 * Calculate price for a specific promotion based on user's account type and ad's category tier
 * Requires: Authentication
 *
 * Query params:
 * - promotionType: 'featured' | 'urgent' | 'sticky' (required)
 * - durationDays: number (required)
 * - adId: number (required for category-based pricing)
 * - tier: string (optional, override tier lookup)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const promotionType = searchParams.get('promotionType');
    const durationDays = searchParams.get('durationDays');
    const adId = searchParams.get('adId');
    const tierOverride = searchParams.get('tier');

    // Validate required params
    if (!promotionType || !durationDays) {
      return NextResponse.json(
        {
          success: false,
          message: 'Promotion type and duration are required',
        },
        { status: 400 }
      );
    }

    // Get user's account type
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Determine account type for pricing
    let accountType: string;
    if (user.business_verification_status === 'approved') {
      accountType = 'business';
    } else if (user.individual_verified) {
      accountType = 'individual_verified';
    } else {
      accountType = 'individual';
    }

    // Determine pricing tier from ad's category
    let pricingTier = 'default';

    if (tierOverride && VALID_TIERS.includes(tierOverride)) {
      // Use override if provided
      pricingTier = tierOverride;
    } else if (adId) {
      // Look up ad's category and get its pricing tier
      const ad = await prisma.ads.findUnique({
        where: { id: parseInt(adId, 10) },
        select: {
          category_id: true,
          categories: {
            select: {
              id: true,
              name: true,
              parent_id: true,
              categories: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (ad?.categories) {
        // Get the parent category name (or current if it's a root category)
        const categoryName = ad.categories.categories?.name || ad.categories.name;

        // Look up tier mapping
        const tierMapping = await prisma.category_pricing_tiers.findFirst({
          where: {
            category_name: categoryName,
            is_active: true,
          },
          select: {
            pricing_tier: true,
          },
        });

        if (tierMapping) {
          pricingTier = tierMapping.pricing_tier;
        }
      }
    }

    // Get pricing for this combination
    const pricing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: parseInt(durationDays, 10),
        account_type: accountType,
        pricing_tier: pricingTier,
        is_active: true,
      },
      select: {
        price: true,
        discount_percentage: true,
        pricing_tier: true,
      },
    });

    // If no pricing found for this tier, fallback to default
    let finalPricing = pricing;
    if (!pricing && pricingTier !== 'default') {
      finalPricing = await prisma.promotion_pricing.findFirst({
        where: {
          promotion_type: promotionType,
          duration_days: parseInt(durationDays, 10),
          account_type: accountType,
          pricing_tier: 'default',
          is_active: true,
        },
        select: {
          price: true,
          discount_percentage: true,
          pricing_tier: true,
        },
      });
    }

    if (!finalPricing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pricing not found for the selected options',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          promotionType,
          durationDays: parseInt(durationDays, 10),
          accountType,
          pricingTier: finalPricing.pricing_tier,
          price: parseFloat(finalPricing.price.toString()),
          discountPercentage: finalPricing.discount_percentage,
          currency: 'NPR',
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Promotion price calculation error:', err);

    if (err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to calculate price',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
