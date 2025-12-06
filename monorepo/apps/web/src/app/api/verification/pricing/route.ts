import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { formatDurationLabel } from '@/lib/verificationUtils';

/**
 * GET /api/verification/pricing
 * Get verification pricing for users (public - but checks if free promotion applies)
 */
export async function GET(request: NextRequest) {
  try {
    // Get all active pricing
    const pricings = await prisma.verification_pricing.findMany({
      where: { is_active: true },
      orderBy: [
        { verification_type: 'asc' },
        { duration_days: 'asc' },
      ],
    });

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
    // For now, we check if user has never been verified before
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
      } catch {
        // Token invalid or expired - no free verification
      }
    }

    // Group pricing by type
    const individualPricing = pricings
      .filter((p) => p.verification_type === 'individual')
      .map((p) => ({
        id: p.id,
        durationDays: p.duration_days,
        durationLabel: formatDurationLabel(p.duration_days),
        price: parseFloat(p.price.toString()),
        discountPercentage: p.discount_percentage || 0,
        finalPrice: calculateFinalPrice(parseFloat(p.price.toString()), p.discount_percentage || 0),
      }));

    const businessPricing = pricings
      .filter((p) => p.verification_type === 'business')
      .map((p) => ({
        id: p.id,
        durationDays: p.duration_days,
        durationLabel: formatDurationLabel(p.duration_days),
        price: parseFloat(p.price.toString()),
        discountPercentage: p.discount_percentage || 0,
        finalPrice: calculateFinalPrice(parseFloat(p.price.toString()), p.discount_percentage || 0),
      }));

    // Free verification settings
    const freeVerification = {
      enabled: settingsMap['free_verification_enabled'] === 'true',
      durationDays: parseInt(settingsMap['free_verification_duration_days'] || '180'),
      types: JSON.parse(settingsMap['free_verification_types'] || '["individual","business"]'),
      isEligible: isEligibleForFreeVerification,
    };

    return NextResponse.json({
      success: true,
      data: {
        individual: individualPricing,
        business: businessPricing,
        freeVerification,
      },
    });
  } catch (error: any) {
    console.error('Get verification pricing error:', error);

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
