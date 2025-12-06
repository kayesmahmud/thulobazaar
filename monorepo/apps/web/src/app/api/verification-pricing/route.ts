import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { formatDurationLabel } from '@/lib/verificationUtils';

/**
 * GET /api/verification-pricing
 * Get all verification pricing options
 *
 * Query params:
 * - type: 'individual' | 'business' (optional - filter by type)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const whereClause: { verification_type?: string; is_active?: boolean } = {
      is_active: true,
    };

    if (type && ['individual', 'business'].includes(type)) {
      whereClause.verification_type = type;
    }

    const pricing = await prisma.verification_pricing.findMany({
      where: whereClause,
      orderBy: [{ verification_type: 'asc' }, { duration_days: 'asc' }],
      select: {
        id: true,
        verification_type: true,
        duration_days: true,
        price: true,
        discount_percentage: true,
      },
    });

    // Transform for frontend
    const formattedPricing = pricing.map((p) => ({
      id: p.id,
      verificationType: p.verification_type,
      durationDays: p.duration_days,
      durationLabel: formatDurationLabel(p.duration_days),
      price: parseFloat(p.price.toString()),
      discountPercentage: p.discount_percentage || 0,
      originalPrice: calculateOriginalPrice(
        parseFloat(p.price.toString()),
        p.discount_percentage || 0
      ),
    }));

    return NextResponse.json({
      success: true,
      data: formattedPricing,
    });
  } catch (error: unknown) {
    console.error('Verification pricing error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch verification pricing',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


function calculateOriginalPrice(
  discountedPrice: number,
  discountPercentage: number
): number {
  if (discountPercentage <= 0) return discountedPrice;
  return Math.round(discountedPrice / (1 - discountPercentage / 100));
}
