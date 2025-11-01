import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/promotions/pricing
 * Get all active promotion pricing (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const pricing = await prisma.promotion_pricing.findMany({
      where: { is_active: true },
      orderBy: [
        { promotion_type: 'asc' },
        { duration_days: 'asc' },
        { account_type: 'desc' },
      ],
      select: {
        id: true,
        promotion_type: true,
        duration_days: true,
        account_type: true,
        price: true,
        discount_percentage: true,
        is_active: true,
      },
    });

    // Group by promotion type and duration for easier frontend use
    const pricingMap: any = {};
    pricing.forEach((row) => {
      if (!pricingMap[row.promotion_type]) {
        pricingMap[row.promotion_type] = {};
      }
      if (!pricingMap[row.promotion_type][row.duration_days]) {
        pricingMap[row.promotion_type][row.duration_days] = {};
      }
      pricingMap[row.promotion_type][row.duration_days][row.account_type] = {
        id: row.id,
        price: parseFloat(row.price.toString()),
        discountPercentage: row.discount_percentage,
      };
    });

    // Transform to camelCase for raw data
    const transformedPricing = pricing.map((p) => ({
      id: p.id,
      promotionType: p.promotion_type,
      durationDays: p.duration_days,
      accountType: p.account_type,
      price: parseFloat(p.price.toString()),
      discountPercentage: p.discount_percentage,
      isActive: p.is_active,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          pricing: pricingMap,
          raw: transformedPricing,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promotion pricing fetch error:', error);
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
