import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/profiles/shop/:slug/ads
 * Get paginated ads from a shop/seller
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - status: Ad status (default: 'approved')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const status = searchParams.get('status') || 'approved';
    const offset = (page - 1) * limit;

    // Find user by shop_slug or seller_slug
    const user = await prisma.users.findFirst({
      where: {
        OR: [{ shop_slug: slug }, { seller_slug: slug }],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop not found',
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      user_id: user.id,
      status: status,
      deleted_at: null,
    };

    // Get total count
    const total = await prisma.ads.count({ where });

    // Get ads with pagination
    const ads = await prisma.ads.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        condition: true,
        description: true,
        created_at: true,
        view_count: true,
        is_featured: true,
        is_bumped: true,
        is_sticky: true,
        is_urgent: true,
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
        { created_at: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      price: ad.price ? parseFloat(ad.price.toString()) : 0,
      condition: ad.condition,
      description: ad.description,
      createdAt: ad.created_at,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isBumped: ad.is_bumped,
      isSticky: ad.is_sticky,
      isUrgent: ad.is_urgent,
      slug: ad.slug,
      category: ad.categories
        ? {
            id: ad.categories.id,
            name: ad.categories.name,
            slug: ad.categories.slug,
          }
        : null,
      location: ad.locations
        ? {
            id: ad.locations.id,
            name: ad.locations.name,
            type: ad.locations.type,
            slug: ad.locations.slug,
          }
        : null,
      categoryName: ad.categories?.name || null,
      locationName: ad.locations?.name || null,
      primaryImage: ad.ad_images[0]?.file_path || null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedAds,
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
    console.error('Shop ads fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Server error while fetching shop ads',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
