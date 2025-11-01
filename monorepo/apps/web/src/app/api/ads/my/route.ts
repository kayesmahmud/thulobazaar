import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/ads/my
 * Get current user's ads (all statuses including drafts/pending/approved/rejected)
 * Requires: Authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    // Fetch user's ads with related data
    const ads = await prisma.ads.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        condition: true,
        status: true,
        view_count: true,
        is_featured: true,
        is_bumped: true,
        is_sticky: true,
        is_urgent: true,
        created_at: true,
        updated_at: true,
        slug: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        ad_images: {
          where: { is_primary: true },
          select: {
            filename: true,
            file_path: true,
          },
          take: 1,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform to camelCase with views mapping
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ? parseFloat(ad.price.toString()) : 0,
      condition: ad.condition,
      status: ad.status === 'approved' ? 'active' : ad.status, // Map approved to active for frontend
      views: ad.view_count, // Map view_count to views
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isBumped: ad.is_bumped,
      isSticky: ad.is_sticky,
      isUrgent: ad.is_urgent,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      slug: ad.slug,
      categoryId: ad.categories?.id,
      categoryName: ad.categories?.name,
      categorySlug: ad.categories?.slug,
      locationId: ad.locations?.id,
      locationName: ad.locations?.name,
      locationSlug: ad.locations?.slug,
      primaryImage: ad.ad_images[0]?.file_path || null,
    }));

    console.log(`Found ${transformedAds.length} ads for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        data: transformedAds,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('My ads fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch your ads',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
