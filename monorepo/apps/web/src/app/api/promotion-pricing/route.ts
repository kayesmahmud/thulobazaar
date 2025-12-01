import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/promotion-pricing
 * Get all active promotion pricing (public endpoint)
 *
 * Returns pricing grouped by promotion type and duration for easy frontend consumption
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all active promotion pricing
    const pricing = await prisma.promotion_pricing.findMany({
      where: { is_active: true },
      select: {
        id: true,
        promotion_type: true,
        duration_days: true,
        account_type: true,
        price: true,
        discount_percentage: true,
        is_active: true,
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

    // Group by promotion type and duration for easier frontend use
    const pricingMap: Record<string, Record<number, Record<string, any>>> = {};

    pricing.forEach((row) => {
      const promotionType = row.promotion_type || 'unknown';
      const durationDays = row.duration_days || 0;
      const accountType = row.account_type || 'individual';

      if (!pricingMap[promotionType]) {
        pricingMap[promotionType] = {};
      }
      if (!pricingMap[promotionType][durationDays]) {
        pricingMap[promotionType][durationDays] = {};
      }
      pricingMap[promotionType][durationDays][accountType] = {
        id: row.id,
        price: parseFloat(row.price.toString()),
        discountPercentage: row.discount_percentage,
      };
    });

    // Transform raw data to camelCase
    const transformedRaw = pricing.map((p) => ({
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
          raw: transformedRaw,
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

/**
 * POST /api/promotion-pricing
 * Create new promotion pricing entry
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - promotion_type: 'featured' | 'urgent' | 'sticky' | 'bump_up' (required)
 * - duration_days: number (required)
 * - account_type: 'individual' | 'business' (required)
 * - price: number (required)
 * - discount_percentage: number (optional, default: 0)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { promotion_type, duration_days, account_type, price, discount_percentage } = body;

    // Validate required fields
    if (!promotion_type || !duration_days || !account_type || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Promotion type, duration, account type, and price are required',
        },
        { status: 400 }
      );
    }

    // Validate promotion type
    const validPromotionTypes = ['featured', 'urgent', 'sticky', 'bump_up'];
    if (!validPromotionTypes.includes(promotion_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid promotion type. Must be: featured, urgent, sticky, or bump_up',
        },
        { status: 400 }
      );
    }

    // Validate account type
    if (!['individual', 'business'].includes(account_type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid account type. Must be: individual or business',
        },
        { status: 400 }
      );
    }

    // Create promotion pricing
    const newPricing = await prisma.promotion_pricing.create({
      data: {
        promotion_type,
        duration_days: parseInt(duration_days),
        account_type,
        price: parseFloat(price),
        discount_percentage: discount_percentage || 0,
        is_active: true,
      },
    });

    console.log(`✅ Promotion pricing created by editor ${editor.userId}:`, newPricing);

    return NextResponse.json(
      {
        success: true,
        message: 'Promotion pricing created successfully',
        data: {
          id: newPricing.id,
          promotionType: newPricing.promotion_type,
          durationDays: newPricing.duration_days,
          accountType: newPricing.account_type,
          price: parseFloat(newPricing.price.toString()),
          discountPercentage: newPricing.discount_percentage,
          isActive: newPricing.is_active,
          createdAt: newPricing.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Promotion pricing creation error:', error);

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

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          message: 'Pricing for this combination already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create promotion pricing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
