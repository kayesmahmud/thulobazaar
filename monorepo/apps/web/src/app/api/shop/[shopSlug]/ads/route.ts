import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { getShopProfile } from '@/lib/shops';

interface RouteParams {
  params: Promise<{ shopSlug: string }>;
}

/**
 * GET /api/shop/[shopSlug]/ads
 * Fetch ads for a specific shop
 * Mobile-compatible endpoint
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sort: 'newest' | 'price_low' | 'price_high' | 'popular' (default: 'newest')
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shopSlug } = await params;
    const { searchParams } = new URL(request.url);

    if (!shopSlug) {
      return NextResponse.json(
        { success: false, message: 'Shop slug is required' },
        { status: 400 }
      );
    }

    // Get shop profile to find user ID
    const shop = await getShopProfile(shopSlug);

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const sort = searchParams.get('sort') || 'newest';
    const offset = (page - 1) * limit;

    // Build orderBy
    let orderBy: any;
    switch (sort) {
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { view_count: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = [
          { is_sticky: 'desc' },
          { is_bumped: 'desc' },
          { created_at: 'desc' },
        ];
        break;
    }

    // Get total count
    const total = await prisma.ads.count({
      where: {
        user_id: shop.id,
        status: 'approved',
        deleted_at: null,
      },
    });

    // Fetch ads
    const ads = await prisma.ads.findMany({
      where: {
        user_id: shop.id,
        status: 'approved',
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        condition: true,
        slug: true,
        view_count: true,
        is_featured: true,
        is_urgent: true,
        is_sticky: true,
        is_bumped: true,
        created_at: true,
        ad_images: {
          where: { is_primary: true },
          take: 1,
          select: {
            id: true,
            filename: true,
            file_path: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ? parseFloat(ad.price.toString()) : null,
      condition: ad.condition,
      slug: ad.slug,
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isUrgent: ad.is_urgent,
      isSticky: ad.is_sticky,
      isBumped: ad.is_bumped,
      createdAt: ad.created_at,
      primaryImage: ad.ad_images[0]
        ? {
            id: ad.ad_images[0].id,
            filename: ad.ad_images[0].filename,
            filePath: ad.ad_images[0].file_path,
          }
        : null,
      category: ad.categories
        ? {
            id: ad.categories.id,
            name: ad.categories.name,
            slug: ad.categories.slug,
            icon: ad.categories.icon,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: transformedAds,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Shop ads fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shop ads' },
      { status: 500 }
    );
  }
}
