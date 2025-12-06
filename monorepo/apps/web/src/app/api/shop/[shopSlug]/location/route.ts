import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

interface RouteContext {
  params: Promise<{ shopSlug: string }>;
}

/**
 * PUT /api/shop/:shopSlug/location
 * Update shop's location/address information
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);
    const { shopSlug } = await context.params;

    // Get the user by shop_slug, custom_shop_slug, or seller_slug
    const shop = await prisma.users.findFirst({
      where: {
        OR: [
          { shop_slug: shopSlug },
          { custom_shop_slug: shopSlug },
          { seller_slug: shopSlug },
        ],
      },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (shop.id !== userId) {
      return NextResponse.json(
        { success: false, message: 'You can only edit your own shop' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { business_address } = body;

    // Update the shop
    await prisma.users.update({
      where: { id: userId },
      data: {
        business_address: business_address || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Location information updated successfully',
    });
  } catch (error: any) {
    console.error('Shop location update error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update location information',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
