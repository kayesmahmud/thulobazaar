import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/promotions
 * Get user's promotion history
 *
 * Query params:
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.ad_promotions.count({
      where: { user_id: userId },
    });

    // Fetch promotions with ad details
    const promotions = await prisma.ad_promotions.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        ad_id: true,
        user_id: true,
        promotion_type: true,
        duration_days: true,
        price_paid: true,
        account_type: true,
        payment_reference: true,
        payment_method: true,
        starts_at: true,
        expires_at: true,
        is_active: true,
        created_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            status: true,
            slug: true,
            ad_images: {
              where: { is_primary: true },
              select: {
                file_path: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedPromotions = promotions.map((promo) => ({
      id: promo.id,
      adId: promo.ad_id,
      userId: promo.user_id,
      promotionType: promo.promotion_type,
      durationDays: promo.duration_days,
      pricePaid: parseFloat(promo.price_paid.toString()),
      accountType: promo.account_type,
      paymentReference: promo.payment_reference,
      paymentMethod: promo.payment_method,
      startsAt: promo.starts_at,
      expiresAt: promo.expires_at,
      isActive: promo.is_active,
      createdAt: promo.created_at,
      ad: {
        id: promo.ads.id,
        title: promo.ads.title,
        status: promo.ads.status,
        slug: promo.ads.slug,
        primaryImage: promo.ads.ad_images[0]?.file_path || null,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedPromotions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promotions fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch promotions',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions
 * Apply promotion to an ad
 *
 * Body:
 * - adId: number (required)
 * - promotionType: string (required) - 'featured' | 'urgent' | 'sticky' | 'bump_up'
 * - durationDays: number (required) - 3, 7, 15, 30
 * - paymentReference: string (optional)
 * - paymentMethod: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { adId, promotionType, durationDays, paymentReference, paymentMethod } =
      body;

    // Validate required fields
    if (!adId || !promotionType || !durationDays) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad ID, promotion type, and duration are required',
        },
        { status: 400 }
      );
    }

    // Validate promotion type
    const validTypes = ['featured', 'urgent', 'sticky', 'bump_up'];
    if (!validTypes.includes(promotionType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid promotion type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Verify ad belongs to user
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId) },
      select: {
        id: true,
        user_id: true,
        status: true,
      },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    if (ad.user_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You can only promote your own ads',
        },
        { status: 403 }
      );
    }

    // Get user's account type
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { account_type: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const accountType = user.account_type;

    // Get pricing
    const pricing = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: parseInt(durationDays),
        account_type: accountType || undefined,
        is_active: true,
      },
      select: { price: true },
    });

    if (!pricing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pricing not found for this promotion',
        },
        { status: 404 }
      );
    }

    const price = parseFloat(pricing.price.toString());

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

    // Insert promotion record
    const promotion = await prisma.ad_promotions.create({
      data: {
        ad_id: ad.id,
        user_id: userId,
        promotion_type: promotionType,
        duration_days: parseInt(durationDays),
        price_paid: price,
        account_type: accountType || 'individual',
        payment_reference: paymentReference || '',
        payment_method: paymentMethod || 'unknown',
        expires_at: expiresAt,
      },
    });

    // Update ad table with promotion flags
    const updateData: any = {};

    if (promotionType === 'featured') {
      updateData.is_featured = true;
      updateData.featured_until = expiresAt;
    } else if (promotionType === 'bump_up') {
      updateData.is_bumped = true;
      updateData.bump_expires_at = expiresAt;
    } else if (promotionType === 'sticky') {
      updateData.is_sticky = true;
      updateData.sticky_until = expiresAt;
    } else if (promotionType === 'urgent') {
      updateData.is_urgent = true;
      updateData.urgent_until = expiresAt;
    }

    await prisma.ads.update({
      where: { id: ad.id },
      data: updateData,
    });

    console.log(
      `✅ Ad ${ad.id} promoted with ${promotionType} for ${durationDays} days by user ${userId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Ad promoted successfully',
        data: {
          id: promotion.id,
          adId: promotion.ad_id,
          promotionType: promotion.promotion_type,
          durationDays: promotion.duration_days,
          pricePaid: parseFloat(promotion.price_paid.toString()),
          expiresAt: promotion.expires_at,
          createdAt: promotion.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Promotion creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to promote ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
