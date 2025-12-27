import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const pricings = await prisma.verification_pricing.findMany({
      orderBy: [{ verification_type: 'asc' }, { duration_days: 'asc' }],
    });

    const transformed = pricings.map((p) => ({
      id: p.id,
      verificationType: p.verification_type,
      durationDays: p.duration_days,
      price: parseFloat(p.price.toString()),
      discountPercentage: p.discount_percentage || 0,
      isActive: p.is_active ?? true,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({ success: true, data: transformed });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Pricing fetch error:', err);
    if (err.message === 'Unauthorized' || err.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch pricing' }, { status: 500 });
  }
}
