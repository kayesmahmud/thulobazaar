import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/favorites
 * Get user's favorited ads
 *
 * Query params:
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.user_favorites.count({
      where: { user_id: userId },
    });

    // Fetch favorites with ad details
    const favorites = await prisma.user_favorites.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        ad_id: true,
        created_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            condition: true,
            status: true,
            slug: true,
            view_count: true,
            is_featured: true,
            is_urgent: true,
            created_at: true,
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
              },
            },
            ad_images: {
              where: { is_primary: true },
              select: {
                file_path: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedFavorites = favorites.map((fav) => ({
      id: fav.id,
      adId: fav.ad_id,
      createdAt: fav.created_at,
      ad: {
        id: fav.ads.id,
        title: fav.ads.title,
        description: fav.ads.description,
        price: fav.ads.price ? parseFloat(fav.ads.price.toString()) : null,
        condition: fav.ads.condition,
        status: fav.ads.status,
        slug: fav.ads.slug,
        viewCount: fav.ads.view_count,
        isFeatured: fav.ads.is_featured,
        isUrgent: fav.ads.is_urgent,
        createdAt: fav.ads.created_at,
        category: fav.ads.categories
          ? {
              id: fav.ads.categories.id,
              name: fav.ads.categories.name,
              slug: fav.ads.categories.slug,
            }
          : null,
        location: fav.ads.locations
          ? {
              id: fav.ads.locations.id,
              name: fav.ads.locations.name,
              type: fav.ads.locations.type,
            }
          : null,
        primaryImage: fav.ads.ad_images[0]?.file_path || null,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedFavorites,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Favorites fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch favorites',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * Add ad to favorites
 *
 * Body:
 * - adId: number (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { adId } = body;

    // Validate required fields
    if (!adId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad ID is required',
        },
        { status: 400 }
      );
    }

    // Check if ad exists
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId) },
      select: { id: true, status: true, deleted_at: true },
    });

    if (!ad || ad.deleted_at) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.user_favorites.findFirst({
      where: {
        user_id: userId,
        ad_id: ad.id,
      },
      select: { id: true },
    });

    if (existingFavorite) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad is already in favorites',
        },
        { status: 400 }
      );
    }

    // Add to favorites
    const favorite = await prisma.user_favorites.create({
      data: {
        user_id: userId,
        ad_id: ad.id,
      },
    });

    console.log(`✅ User ${userId} added ad ${ad.id} to favorites`);

    return NextResponse.json(
      {
        success: true,
        message: 'Ad added to favorites',
        data: {
          id: favorite.id,
          adId: favorite.ad_id,
          createdAt: favorite.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add favorite error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to add to favorites',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
