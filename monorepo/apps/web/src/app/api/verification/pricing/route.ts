import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { formatDurationLabel } from '@/lib/verification';

interface ActiveCampaign {
  id: number;
  name: string;
  description: string | null;
  discountPercentage: number;
  bannerText: string;
  bannerEmoji: string | null;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  appliesToTypes: string[];
  minDurationDays: number | null;
}

/**
 * GET /api/verification/pricing
 * Get verification pricing for users (public - but checks if free promotion applies)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Get all active pricing
    const pricings = await prisma.verification_pricing.findMany({
      where: { is_active: true },
      orderBy: [
        { verification_type: 'asc' },
        { duration_days: 'asc' },
      ],
    });

    // Get active verification campaign (best one by discount)
    const activeCampaigns = await prisma.verification_campaigns.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      orderBy: { discount_percentage: 'desc' },
    });

    // Filter campaigns that haven't reached max uses
    const validCampaigns = activeCampaigns.filter((c) => {
      if (c.max_uses && c.current_uses && c.current_uses >= c.max_uses) {
        return false;
      }
      return true;
    });

    // Get the best campaign (highest discount)
    const activeCampaign = validCampaigns.length > 0 ? validCampaigns[0] : null;
    let campaignData: ActiveCampaign | null = null;

    if (activeCampaign) {
      const endDate = new Date(activeCampaign.end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      campaignData = {
        id: activeCampaign.id,
        name: activeCampaign.name,
        description: activeCampaign.description,
        discountPercentage: activeCampaign.discount_percentage,
        bannerText: activeCampaign.banner_text || `${activeCampaign.banner_emoji} ${activeCampaign.name} - ${activeCampaign.discount_percentage}% OFF!`,
        bannerEmoji: activeCampaign.banner_emoji,
        startDate: activeCampaign.start_date,
        endDate: activeCampaign.end_date,
        daysRemaining,
        appliesToTypes: activeCampaign.applies_to_types || [],
        minDurationDays: activeCampaign.min_duration_days,
      };
    }

    // Get free verification settings
    const settings = await prisma.site_settings.findMany({
      where: {
        setting_key: {
          in: ['free_verification_enabled', 'free_verification_duration_days', 'free_verification_types'],
        },
      },
    });

    const settingsMap: Record<string, string | null> = {};
    settings.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    // Check if user is eligible for free verification
    let isEligibleForFreeVerification = false;
    let userId: number | null = null;

    // Try to get user from token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
        userId = decoded.userId;

        if (userId && settingsMap['free_verification_enabled'] === 'true') {
          // Check if user has ever been verified
          const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
              individual_verified: true,
              individual_verification_expires_at: true,
              business_verification_status: true,
              business_verification_expires_at: true,
            },
          });

          // User is eligible if they have never had any verification
          if (user) {
            const hasHadIndividualVerification = user.individual_verified || user.individual_verification_expires_at;
            const hasHadBusinessVerification = user.business_verification_status === 'approved' || user.business_verification_expires_at;
            isEligibleForFreeVerification = !hasHadIndividualVerification && !hasHadBusinessVerification;
          }
        }
      } catch (err) {
        // Token invalid or expired - no free verification
        console.debug('Token validation for free verification failed:', err);
      }
    }

    // Helper to check if campaign applies to a verification type and duration
    const getCampaignDiscount = (verificationType: string, durationDays: number): number => {
      if (!campaignData) return 0;

      // Check if campaign applies to this type
      if (campaignData.appliesToTypes.length > 0 && !campaignData.appliesToTypes.includes(verificationType)) {
        return 0;
      }

      // Check minimum duration requirement
      if (campaignData.minDurationDays && durationDays < campaignData.minDurationDays) {
        return 0;
      }

      return campaignData.discountPercentage;
    };

    // Group pricing by type - apply campaign discount instead of static discount
    const individualPricing = pricings
      .filter((p) => p.verification_type === 'individual')
      .map((p) => {
        const basePrice = parseFloat(p.price.toString());
        const campaignDiscount = getCampaignDiscount('individual', p.duration_days);
        const discountToApply = campaignDiscount; // Use campaign discount only

        return {
          id: p.id,
          durationDays: p.duration_days,
          durationLabel: formatDurationLabel(p.duration_days),
          price: basePrice,
          discountPercentage: discountToApply,
          finalPrice: calculateFinalPrice(basePrice, discountToApply),
          hasCampaignDiscount: campaignDiscount > 0,
        };
      });

    const businessPricing = pricings
      .filter((p) => p.verification_type === 'business')
      .map((p) => {
        const basePrice = parseFloat(p.price.toString());
        const campaignDiscount = getCampaignDiscount('business', p.duration_days);
        const discountToApply = campaignDiscount; // Use campaign discount only

        return {
          id: p.id,
          durationDays: p.duration_days,
          durationLabel: formatDurationLabel(p.duration_days),
          price: basePrice,
          discountPercentage: discountToApply,
          finalPrice: calculateFinalPrice(basePrice, discountToApply),
          hasCampaignDiscount: campaignDiscount > 0,
        };
      });

    // Free verification settings
    const freeVerification = {
      enabled: settingsMap['free_verification_enabled'] === 'true',
      durationDays: parseInt(settingsMap['free_verification_duration_days'] || '180', 10),
      types: JSON.parse(settingsMap['free_verification_types'] || '["individual","business"]'),
      isEligible: isEligibleForFreeVerification,
    };

    return NextResponse.json({
      success: true,
      data: {
        individual: individualPricing,
        business: businessPricing,
        freeVerification,
        campaign: campaignData,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Get verification pricing error:', err);

    return NextResponse.json(
      { success: false, message: 'Failed to fetch verification pricing' },
      { status: 500 }
    );
  }
}


function calculateFinalPrice(price: number, discountPercentage: number): number {
  if (discountPercentage <= 0) return price;
  return Math.round(price * (1 - discountPercentage / 100));
}
