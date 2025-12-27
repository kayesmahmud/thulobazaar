import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/verification-campaigns/active
 * Get currently active verification campaigns (public endpoint)
 *
 * Query params:
 * - verificationType: Filter by verification type ('individual' | 'business')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verificationType = searchParams.get('verificationType');
    const now = new Date();

    // Get all active campaigns
    const campaigns = await prisma.verification_campaigns.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      orderBy: { discount_percentage: 'desc' },
    });

    // Filter by verification type and check max uses
    const filteredCampaigns = campaigns.filter((c) => {
      // Check verification type filter
      if (verificationType && c.applies_to_types && c.applies_to_types.length > 0) {
        if (!c.applies_to_types.includes(verificationType)) return false;
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
        appliesToTypes: c.applies_to_types,
        minDurationDays: c.min_duration_days,
        usesRemaining: c.max_uses ? c.max_uses - (c.current_uses || 0) : null,
      };
    });

    // Get the best applicable campaign (highest discount)
    const bestCampaign = transformedCampaigns.length > 0 ? transformedCampaigns[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        campaign: bestCampaign,
        campaigns: transformedCampaigns,
        hasActiveCampaign: transformedCampaigns.length > 0,
      },
    });
  } catch (error) {
    console.error('Active verification campaign fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}
