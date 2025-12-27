import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';

interface RouteParams { params: Promise<{ id: string }>; }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.discount_percentage !== undefined) updateData.discount_percentage = parseInt(body.discount_percentage, 10);
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const pricing = await prisma.verification_pricing.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: pricing });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Pricing update error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
  }
}
