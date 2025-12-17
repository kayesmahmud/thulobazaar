import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';

/**
 * GET /api/super-admin/promotional-campaigns
 * Get all promotional campaigns
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const whereClause: Record<string, unknown> = {};

    if (activeOnly) {
      const now = new Date();
      whereClause.is_active = true;
      whereClause.start_date = { lte: now };
      whereClause.end_date = { gte: now };
    }

    const campaigns = await prisma.promotional_campaigns.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform to camelCase
    const transformedCampaigns = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      discountPercentage: c.discount_percentage,
      promoCode: c.promo_code,
      bannerText: c.banner_text,
      bannerEmoji: c.banner_emoji,
      startDate: c.start_date,
      endDate: c.end_date,
      isActive: c.is_active,
      appliesToTiers: c.applies_to_tiers,
      appliesToPromotionTypes: c.applies_to_promotion_types,
      minDurationDays: c.min_duration_days,
      maxUses: c.max_uses,
      currentUses: c.current_uses,
      createdBy: c.users ? {
        id: c.users.id,
        fullName: c.users.full_name,
        email: c.users.email,
      } : null,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedCampaigns,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Promotional campaigns fetch error:', err);

    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === 'Unauthorized' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaigns', error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/promotional-campaigns
 * Create a new promotional campaign
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();

    const {
      name,
      description,
      discountPercentage,
      promoCode,
      bannerText,
      bannerEmoji,
      startDate,
      endDate,
      appliesToTiers,
      appliesToPromotionTypes,
      minDurationDays,
      maxUses,
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate || discountPercentage === undefined) {
      return NextResponse.json(
        { success: false, message: 'Name, start date, end date, and discount percentage are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json(
        { success: false, message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for overlapping active campaigns (only 1 campaign at a time allowed)
    const overlappingCampaign = await prisma.promotional_campaigns.findFirst({
      where: {
        is_active: true,
        OR: [
          // New campaign starts during existing campaign
          {
            start_date: { lte: start },
            end_date: { gte: start },
          },
          // New campaign ends during existing campaign
          {
            start_date: { lte: end },
            end_date: { gte: end },
          },
          // New campaign completely contains existing campaign
          {
            start_date: { gte: start },
            end_date: { lte: end },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        start_date: true,
        end_date: true,
      },
    });

    if (overlappingCampaign) {
      const existingStart = new Date(overlappingCampaign.start_date).toLocaleDateString();
      const existingEnd = new Date(overlappingCampaign.end_date).toLocaleDateString();
      return NextResponse.json(
        {
          success: false,
          message: `Date conflict: Campaign "${overlappingCampaign.name}" is already active from ${existingStart} to ${existingEnd}. Only one campaign can be active at a time.`,
        },
        { status: 409 }
      );
    }

    // Check for duplicate promo code
    if (promoCode) {
      const existing = await prisma.promotional_campaigns.findFirst({
        where: { promo_code: promoCode },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Promo code "${promoCode}" is already used by campaign "${existing.name}"` },
          { status: 409 }
        );
      }
    }

    const campaign = await prisma.promotional_campaigns.create({
      data: {
        name,
        description: description || null,
        discount_percentage: parseInt(discountPercentage, 10),
        promo_code: promoCode || null,
        banner_text: bannerText || null,
        banner_emoji: bannerEmoji || '🎉',
        start_date: start,
        end_date: end,
        is_active: true,
        applies_to_tiers: appliesToTiers || [],
        applies_to_promotion_types: appliesToPromotionTypes || [],
        min_duration_days: minDurationDays ? parseInt(minDurationDays, 10) : null,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        current_uses: 0,
        created_by: admin.userId,
      },
    });

    console.log(`✅ Promotional campaign created: ${campaign.name} by admin ${admin.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        id: campaign.id,
        name: campaign.name,
        discountPercentage: campaign.discount_percentage,
        promoCode: campaign.promo_code,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Campaign creation error:', err);

    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === 'Unauthorized' ? 401 : 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create campaign', error: err.message },
      { status: 500 }
    );
  }
}
