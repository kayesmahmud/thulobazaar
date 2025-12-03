import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAdmin } from '@/lib/jwt';

/**
 * GET /api/admin/verification-pricing
 * Get all verification pricing (super admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    await requireAdmin(request);

    const pricings = await prisma.verification_pricing.findMany({
      orderBy: [
        { verification_type: 'asc' },
        { duration_days: 'asc' },
      ],
    });

    // Get site settings for free verification promotion
    const settings = await prisma.site_settings.findMany({
      where: {
        setting_key: {
          in: ['free_verification_enabled', 'free_verification_duration_days', 'free_verification_types'],
        },
      },
    });

    const settingsMap: Record<string, string | null> = {};
    settings.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    return NextResponse.json({
      success: true,
      data: {
        pricings: pricings.map((p) => ({
          id: p.id,
          verificationType: p.verification_type,
          durationDays: p.duration_days,
          price: parseFloat(p.price.toString()),
          discountPercentage: p.discount_percentage || 0,
          isActive: p.is_active ?? true,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
        freeVerification: {
          enabled: settingsMap['free_verification_enabled'] === 'true',
          durationDays: parseInt(settingsMap['free_verification_duration_days'] || '180'),
          types: JSON.parse(settingsMap['free_verification_types'] || '["individual","business"]'),
        },
      },
    });
  } catch (error: any) {
    console.error('Get verification pricing error:', error);

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

    return NextResponse.json(
      { success: false, message: 'Failed to fetch verification pricing' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/verification-pricing
 * Update verification pricing (super admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate super admin
    await requireAdmin(request);

    const body = await request.json();
    const { id, price, discountPercentage, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.verification_pricing.update({
      where: { id },
      data: {
        price: price !== undefined ? price : undefined,
        discount_percentage: discountPercentage !== undefined ? discountPercentage : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        verificationType: updated.verification_type,
        durationDays: updated.duration_days,
        price: parseFloat(updated.price.toString()),
        discountPercentage: updated.discount_percentage || 0,
        isActive: updated.is_active ?? true,
      },
    });
  } catch (error: any) {
    console.error('Update verification pricing error:', error);

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

    return NextResponse.json(
      { success: false, message: 'Failed to update verification pricing' },
      { status: 500 }
    );
  }
}
