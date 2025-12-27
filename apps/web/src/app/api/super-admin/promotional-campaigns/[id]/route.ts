import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/super-admin/promotional-campaigns/[id]
 * Get a specific campaign
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const campaign = await prisma.promotional_campaigns.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        users: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        discountPercentage: campaign.discount_percentage,
        promoCode: campaign.promo_code,
        bannerText: campaign.banner_text,
        bannerEmoji: campaign.banner_emoji,
        startDate: campaign.start_date,
        endDate: campaign.end_date,
        isActive: campaign.is_active,
        appliesToTiers: campaign.applies_to_tiers,
        appliesToPromotionTypes: campaign.applies_to_promotion_types,
        minDurationDays: campaign.min_duration_days,
        maxUses: campaign.max_uses,
        currentUses: campaign.current_uses,
        createdBy: campaign.users ? {
          id: campaign.users.id,
          fullName: campaign.users.full_name,
          email: campaign.users.email,
        } : null,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/super-admin/promotional-campaigns/[id]
 * Update a campaign
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
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
      isActive,
      appliesToTiers,
      appliesToPromotionTypes,
      minDurationDays,
      maxUses,
    } = body;

    // Check campaign exists
    const existing = await prisma.promotional_campaigns.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check for overlapping campaigns if dates are being changed or campaign is being activated
    const newStartDate = startDate ? new Date(startDate) : existing.start_date;
    const newEndDate = endDate ? new Date(endDate) : existing.end_date;
    const willBeActive = isActive !== undefined ? isActive : existing.is_active;

    if (willBeActive && (startDate !== undefined || endDate !== undefined || isActive === true)) {
      const overlappingCampaign = await prisma.promotional_campaigns.findFirst({
        where: {
          id: { not: parseInt(id, 10) }, // Exclude current campaign
          is_active: true,
          OR: [
            {
              start_date: { lte: newStartDate },
              end_date: { gte: newStartDate },
            },
            {
              start_date: { lte: newEndDate },
              end_date: { gte: newEndDate },
            },
            {
              start_date: { gte: newStartDate },
              end_date: { lte: newEndDate },
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
    }

    // Build update data
    const updateData: Record<string, unknown> = { updated_at: new Date() };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountPercentage !== undefined) updateData.discount_percentage = parseInt(discountPercentage, 10);
    if (promoCode !== undefined) updateData.promo_code = promoCode || null;
    if (bannerText !== undefined) updateData.banner_text = bannerText;
    if (bannerEmoji !== undefined) updateData.banner_emoji = bannerEmoji;
    if (startDate !== undefined) updateData.start_date = new Date(startDate);
    if (endDate !== undefined) updateData.end_date = new Date(endDate);
    if (isActive !== undefined) updateData.is_active = isActive;
    if (appliesToTiers !== undefined) updateData.applies_to_tiers = appliesToTiers;
    if (appliesToPromotionTypes !== undefined) updateData.applies_to_promotion_types = appliesToPromotionTypes;
    if (minDurationDays !== undefined) updateData.min_duration_days = minDurationDays ? parseInt(minDurationDays, 10) : null;
    if (maxUses !== undefined) updateData.max_uses = maxUses ? parseInt(maxUses, 10) : null;

    const campaign = await prisma.promotional_campaigns.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    console.log(`✅ Campaign updated: ${campaign.name} (ID: ${campaign.id})`);

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
      data: {
        id: campaign.id,
        name: campaign.name,
        isActive: campaign.is_active,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update campaign', error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/super-admin/promotional-campaigns/[id]
 * Permanently delete a campaign
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const campaignId = parseInt(id, 10);

    // First check if campaign exists
    const existing = await prisma.promotional_campaigns.findUnique({
      where: { id: campaignId },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Hard delete - permanently remove from database
    await prisma.promotional_campaigns.delete({
      where: { id: campaignId },
    });

    console.log(`✅ Campaign permanently deleted: ${existing.name} (ID: ${existing.id})`);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    if (err.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
