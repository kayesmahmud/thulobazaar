import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ shopSlug: string }>;
}

/**
 * PUT /api/shop/:shopSlug/contact
 * Update shop's contact information
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);
    const { shopSlug } = await context.params;

    // Get the user by shop_slug or custom_shop_slug
    const shop = await prisma.users.findFirst({
      where: {
        OR: [
          { shop_slug: shopSlug },
          { custom_shop_slug: shopSlug },
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
    const { business_phone, business_website, google_maps_link } = body;

    // Update the shop contact info
    // NOTE: Do NOT update 'phone' here - the verified phone is managed
    // separately through the phone verification flow in the profile security tab
    await prisma.users.update({
      where: { id: userId },
      data: {
        business_phone: business_phone || null,
        business_website: business_website || null,
        google_maps_link: google_maps_link || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact information updated successfully',
    });
  } catch (error: any) {
    console.error('Shop contact update error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update contact information',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
