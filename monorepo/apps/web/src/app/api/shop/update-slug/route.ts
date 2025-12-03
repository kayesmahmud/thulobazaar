import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * PUT /api/shop/update-slug
 * Update the user's custom shop slug
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    // Parse request body
    const body = await request.json();
    const { slug } = body;

    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Slug is required' },
        { status: 400 }
      );
    }

    // Normalize the slug
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Check if slug is taken by another user
    const existingUser = await prisma.users.findFirst({
      where: {
        AND: [
          {
            OR: [
              { custom_shop_slug: normalizedSlug },
              { shop_slug: normalizedSlug },
            ],
          },
          { id: { not: userId } },
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'This shop URL is already taken' },
        { status: 400 }
      );
    }

    // Update the user's custom shop slug
    await prisma.users.update({
      where: { id: userId },
      data: {
        custom_shop_slug: normalizedSlug,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Shop URL updated successfully',
      data: {
        shopSlug: normalizedSlug,
      },
    });
  } catch (error: any) {
    console.error('Shop slug update error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update shop URL',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
