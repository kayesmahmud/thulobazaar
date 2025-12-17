import { NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

export async function GET() {
  try {
    const now = new Date();
    const campaign = await prisma.verification_campaigns.findFirst({
      where: { is_active: true, start_date: { lte: now }, end_date: { gte: now } },
      orderBy: { created_at: 'desc' },
    });

    if (!campaign) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: campaign.id, name: campaign.name, description: campaign.description,
        discountPercentage: campaign.discount_percentage, promoCode: campaign.promo_code,
        bannerText: campaign.banner_text, bannerEmoji: campaign.banner_emoji,
        startDate: campaign.start_date, endDate: campaign.end_date,
        appliesToTypes: campaign.applies_to_types,
      },
    });
  } catch (error) {
    console.error('Active campaign fetch error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch campaign' }, { status: 500 });
  }
}
