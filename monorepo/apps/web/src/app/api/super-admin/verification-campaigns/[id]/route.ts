import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const campaign = await prisma.verification_campaigns.findUnique({ where: { id: parseInt(id, 10) } });
    if (!campaign) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: campaign });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Unauthorized') return NextResponse.json({ success: false, message: err.message }, { status: 401 });
    return NextResponse.json({ success: false, message: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = { updated_at: new Date() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountPercentage !== undefined) updateData.discount_percentage = parseInt(body.discountPercentage, 10);
    if (body.promoCode !== undefined) updateData.promo_code = body.promoCode || null;
    if (body.bannerText !== undefined) updateData.banner_text = body.bannerText;
    if (body.bannerEmoji !== undefined) updateData.banner_emoji = body.bannerEmoji;
    if (body.startDate !== undefined) updateData.start_date = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.end_date = new Date(body.endDate);
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.appliesToTypes !== undefined) updateData.applies_to_types = body.appliesToTypes;

    const campaign = await prisma.verification_campaigns.update({ where: { id: parseInt(id, 10) }, data: updateData });
    return NextResponse.json({ success: true, message: 'Updated', data: { id: campaign.id } });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Update error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const campaignId = parseInt(id, 10);
    
    const existing = await prisma.verification_campaigns.findUnique({ where: { id: campaignId } });
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    await prisma.verification_campaigns.delete({ where: { id: campaignId } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Delete error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
