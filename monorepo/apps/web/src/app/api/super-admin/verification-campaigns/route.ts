import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const campaigns = await prisma.verification_campaigns.findMany({
      include: { users: { select: { id: true, full_name: true, email: true } } },
      orderBy: { created_at: 'desc' },
    });

    const transformed = campaigns.map((c) => ({
      id: c.id, name: c.name, description: c.description,
      discountPercentage: c.discount_percentage, promoCode: c.promo_code,
      bannerText: c.banner_text, bannerEmoji: c.banner_emoji,
      startDate: c.start_date, endDate: c.end_date, isActive: c.is_active,
      appliesToTypes: c.applies_to_types, minDurationDays: c.min_duration_days,
      maxUses: c.max_uses, currentUses: c.current_uses,
      createdBy: c.users ? { id: c.users.id, fullName: c.users.full_name, email: c.users.email } : null,
      createdAt: c.created_at, updatedAt: c.updated_at,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin(request);
    const body = await request.json();
    const { name, description, discountPercentage, promoCode, bannerText, bannerEmoji, startDate, endDate, appliesToTypes, minDurationDays, maxUses } = body;

    if (!name || !startDate || !endDate || discountPercentage === undefined) {
      return NextResponse.json({ success: false, message: 'Name, dates, and discount are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return NextResponse.json({ success: false, message: 'End date must be after start date' }, { status: 400 });
    }

    // Check overlapping campaigns
    const overlapping = await prisma.verification_campaigns.findFirst({
      where: {
        is_active: true,
        OR: [
          { start_date: { lte: start }, end_date: { gte: start } },
          { start_date: { lte: end }, end_date: { gte: end } },
          { start_date: { gte: start }, end_date: { lte: end } },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json({
        success: false,
        message: `Date conflict with "${overlapping.name}". Only one campaign can be active at a time.`,
      }, { status: 409 });
    }

    const campaign = await prisma.verification_campaigns.create({
      data: {
        name, description: description || null,
        discount_percentage: parseInt(discountPercentage, 10),
        promo_code: promoCode || null, banner_text: bannerText || null,
        banner_emoji: bannerEmoji || '🎉', start_date: start, end_date: end,
        is_active: true, applies_to_types: appliesToTypes || ['individual', 'business'],
        min_duration_days: minDurationDays ? parseInt(minDurationDays, 10) : null,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        current_uses: 0, created_by: admin.userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Campaign created', data: { id: campaign.id, name: campaign.name } }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Campaign creation error:', err);
    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to create campaign' }, { status: 500 });
  }
}
