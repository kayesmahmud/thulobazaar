import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { optionalAuth } from '@/lib/auth';

/**
 * GET /api/shop/check-slug?slug=xxx
 * Check if a shop slug is available
 * Excludes the current user's own slugs from the check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Slug is required' },
        { status: 400 }
      );
    }

    // Try to get current user ID (optional - for excluding own slug)
    const currentUserId = await optionalAuth(request);

    // Normalize the slug
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // Build where clause - exclude current user if authenticated
    const whereClause: any = {
      OR: [
        { custom_shop_slug: normalizedSlug },
        { shop_slug: normalizedSlug },
      ],
    };

    // Exclude current user's own slugs from check
    if (currentUserId) {
      whereClause.id = { not: currentUserId };
    }

    // Check if slug is taken by another user (in custom_shop_slug or shop_slug)
    const existingUser = await prisma.users.findFirst({
      where: whereClause,
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        available: !existingUser,
      },
    });
  } catch (error: any) {
    console.error('Shop slug check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check slug availability',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
