import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/ads/location/:locationSlug
 * Get ads by location slug
 * Public endpoint
 *
 * Query params:
 * - limit: Number of ads to return (default: 20)
 * - page: Page number (default: 1)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationSlug: string }> }
) {
  try {
    const { locationSlug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Find location by slug
    const location = await prisma.locations.findFirst({
      where: { slug: locationSlug },
      select: { id: true, name: true, type: true },
    });

    if (!location) {
      return NextResponse.json(
        {
          success: false,
          message: 'Location not found',
        },
        { status: 404 }
      );
    }

    // Get total count for pagination
    const total = await prisma.ads.count({
      where: {
        location_id: location.id,
        status: 'approved',
        deleted_at: null,
      },
    });

    // Fetch ads for this location
    const ads = await prisma.ads.findMany({
      where: {
        location_id: location.id,
        status: 'approved',
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        condition: true,
        view_count: true,
        is_featured: true,
        is_bumped: true,
        is_sticky: true,
        is_urgent: true,
        created_at: true,
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
            type: true,
            slug: true,
          },
        },
        users_ads_user_idTousers: {
          select: {
            account_type: true,
            business_verification_status: true,
            individual_verified: true,
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
      orderBy: [
        { is_sticky: 'desc' },
        { is_bumped: 'desc' },
        { is_featured: 'desc' },
        { created_at: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ? parseFloat(ad.price.toString()) : 0,
      condition: ad.condition,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isBumped: ad.is_bumped,
      isSticky: ad.is_sticky,
      isUrgent: ad.is_urgent,
      createdAt: ad.created_at,
      slug: ad.slug,
      categoryId: ad.categories?.id,
      categoryName: ad.categories?.name,
      categorySlug: ad.categories?.slug,
      locationId: ad.locations?.id,
      locationName: ad.locations?.name,
      locationType: ad.locations?.type,
      locationSlug: ad.locations?.slug,
      sellerAccountType: ad.users_ads_user_idTousers?.account_type,
      sellerBusinessVerified:
        ad.users_ads_user_idTousers?.business_verification_status,
      sellerIndividualVerified:
        ad.users_ads_user_idTousers?.individual_verified,
      primaryImage: ad.ad_images[0]?.file_path || null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedAds,
        location: {
          id: location.id,
          name: location.name,
          type: location.type,
          slug: locationSlug,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Ads by location fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching ads by location',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
