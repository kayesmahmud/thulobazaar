import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/promotions/calculate
 * Calculate price for a specific promotion
 *
 * Query params:
 * - promotionType: 'featured' | 'urgent' | 'sticky' | 'bump_up'
 * - durationDays: number (3, 7, 15, 30)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const promotionType = searchParams.get('promotionType');
    const durationDays = searchParams.get('durationDays');

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
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Determine effective account type for pricing
    const accountType =
      user.business_verification_status === 'verified'
        ? 'business'
        : 'individual';

    // Get pricing
    const pricing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: parseInt(durationDays),
        account_type: accountType,
        is_active: true,
      },
      select: {
        price: true,
        discount_percentage: true,
      },
    });

    if (!pricing) {
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
          durationDays: parseInt(durationDays),
          accountType,
          price: parseFloat(pricing.price.toString()),
          discountPercentage: pricing.discount_percentage,
          currency: 'NPR',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promotion calculation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to calculate price',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
