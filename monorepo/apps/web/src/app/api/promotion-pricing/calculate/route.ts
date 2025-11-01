import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/promotion-pricing/calculate
 * Calculate price for a specific promotion based on user's account type
 * Requires: Authentication
 *
 * Query params:
 * - promotionType: 'featured' | 'urgent' | 'sticky' | 'bump_up' (required)
 * - durationDays: number (required)
 * - adId: number (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const promotionType = searchParams.get('promotionType');
    const durationDays = searchParams.get('durationDays');
    const adId = searchParams.get('adId');

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
    // Business pricing only applies if user has verified business account
    const accountType =
      user.business_verification_status === 'approved' ? 'business' : 'individual';

    // Get pricing for this combination
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
    console.error('Promotion price calculation error:', error);

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
