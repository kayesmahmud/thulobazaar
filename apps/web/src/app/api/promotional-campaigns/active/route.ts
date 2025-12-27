import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/promotional-campaigns/active
 * Get currently active promotional campaigns (public endpoint)
 *
 * Query params:
 * - tier: Filter by pricing tier (optional)
 * - promotionType: Filter by promotion type (optional)
 * - promoCode: Validate a specific promo code (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const promotionType = searchParams.get('promotionType');
    const promoCode = searchParams.get('promoCode');

    const now = new Date();

    // Base query for active campaigns
    const whereClause: Record<string, unknown> = {
      is_active: true,
      start_date: { lte: now },
      end_date: { gte: now },
    };

    // If promo code is provided, validate it
    if (promoCode) {
      whereClause.promo_code = promoCode;
    }

    const campaigns = await prisma.promotional_campaigns.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        discount_percentage: true,
        promo_code: true,
        banner_text: true,
        banner_emoji: true,
        start_date: true,
        end_date: true,
        applies_to_tiers: true,
        applies_to_promotion_types: true,
        min_duration_days: true,
        max_uses: true,
        current_uses: true,
      },
      orderBy: { discount_percentage: 'desc' },
    });

    // Filter by tier and promotion type if specified
    const filteredCampaigns = campaigns.filter((c) => {
      // Check tier filter
      if (tier && c.applies_to_tiers && c.applies_to_tiers.length > 0) {
        if (!c.applies_to_tiers.includes(tier)) return false;
      }

      // Check promotion type filter
      if (promotionType && c.applies_to_promotion_types && c.applies_to_promotion_types.length > 0) {
        if (!c.applies_to_promotion_types.includes(promotionType)) return false;
      }

      // Check max uses
      if (c.max_uses && c.current_uses && c.current_uses >= c.max_uses) {
        return false;
      }

      return true;
    });

    // Transform to camelCase and calculate time remaining
    const transformedCampaigns = filteredCampaigns.map((c) => {
      const endDate = new Date(c.end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        discountPercentage: c.discount_percentage,
        promoCode: c.promo_code,
        bannerText: c.banner_text || `${c.banner_emoji} ${c.name} - ${c.discount_percentage}% OFF!`,
        bannerEmoji: c.banner_emoji,
        startDate: c.start_date,
        endDate: c.end_date,
        daysRemaining,
        appliesToTiers: c.applies_to_tiers,
        appliesToPromotionTypes: c.applies_to_promotion_types,
        minDurationDays: c.min_duration_days,
        usesRemaining: c.max_uses ? c.max_uses - (c.current_uses || 0) : null,
      };
    });

    // Get the best applicable campaign (highest discount)
    const bestCampaign = transformedCampaigns.length > 0 ? transformedCampaigns[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        campaigns: transformedCampaigns,
        bestCampaign,
        hasActiveCampaign: transformedCampaigns.length > 0,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Active campaigns fetch error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaigns', error: err.message },
      { status: 500 }
    );
  }
}
