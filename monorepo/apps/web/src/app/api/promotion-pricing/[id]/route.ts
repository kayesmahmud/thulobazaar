import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/promotion-pricing/:id
 * Update promotion pricing
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - price: number (required)
 * - discount_percentage: number (optional)
 * - is_active: boolean (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const { id } = await params;
    const pricingId = parseInt(id);

    if (isNaN(pricingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid pricing ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { price, discount_percentage, is_active } = body;

    // Validate price
    if (price === undefined || price < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid price is required',
        },
        { status: 400 }
      );
    }

    // Update promotion pricing
    const updated = await prisma.promotion_pricing.update({
      where: { id: pricingId },
      data: {
        price: parseFloat(price),
        discount_percentage: discount_percentage !== undefined ? discount_percentage : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Promotion pricing ${pricingId} updated by editor ${editor.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Promotion pricing updated successfully',
        data: {
          id: updated.id,
          promotionType: updated.promotion_type,
          durationDays: updated.duration_days,
          accountType: updated.account_type,
          price: parseFloat(updated.price.toString()),
          discountPercentage: updated.discount_percentage,
          isActive: updated.is_active,
          updatedAt: updated.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promotion pricing update error:', error);

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

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          message: 'Pricing entry not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update promotion pricing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/promotion-pricing/:id
 * Soft delete (deactivate) promotion pricing
 * Requires: Editor or Super Admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const { id } = await params;
    const pricingId = parseInt(id);

    if (isNaN(pricingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid pricing ID' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const deactivated = await prisma.promotion_pricing.update({
      where: { id: pricingId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Promotion pricing ${pricingId} deactivated by editor ${editor.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Promotion pricing deactivated successfully',
        data: {
          id: deactivated.id,
          promotionType: deactivated.promotion_type,
          durationDays: deactivated.duration_days,
          accountType: deactivated.account_type,
          price: parseFloat(deactivated.price.toString()),
          isActive: deactivated.is_active,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promotion pricing deactivation error:', error);

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

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          message: 'Pricing entry not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to deactivate promotion pricing',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
