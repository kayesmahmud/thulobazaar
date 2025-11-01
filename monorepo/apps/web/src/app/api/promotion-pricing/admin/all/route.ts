import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/promotion-pricing/admin/all
 * Get ALL promotion pricing including inactive (admin only)
 * Requires: Editor or Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    // Fetch all promotion pricing (including inactive)
    const pricing = await prisma.promotion_pricing.findMany({
      select: {
        id: true,
        promotion_type: true,
        duration_days: true,
        account_type: true,
        price: true,
        discount_percentage: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: [
        {
          promotion_type: 'asc', // featured, sticky, urgent, bump_up
        },
        {
          duration_days: 'asc',
        },
        {
          account_type: 'desc', // business first, then individual
        },
      ],
    });

    // Transform to camelCase
    const transformedPricing = pricing.map((p) => ({
      id: p.id,
      promotionType: p.promotion_type,
      durationDays: p.duration_days,
      accountType: p.account_type,
      price: parseFloat(p.price.toString()),
      discountPercentage: p.discount_percentage,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedPricing,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin promotion pricing fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch promotion pricing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
