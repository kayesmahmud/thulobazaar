import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { getShopProfile } from '@/lib/shops';

interface RouteParams {
  params: Promise<{ shopSlug: string }>;
}

/**
 * GET /api/shop/[shopSlug]
 * Fetch shop profile by slug
 * Mobile-compatible endpoint
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { shopSlug } = await params;

    if (!shopSlug) {
      return NextResponse.json(
        { success: false, message: 'Shop slug is required' },
        { status: 400 }
      );
    }

    // Use shared helper (already transforms to camelCase)
    const shop = await getShopProfile(shopSlug);

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Get shop stats
    const [adsCount, totalViews] = await Promise.all([
      prisma.ads.count({
        where: {
          user_id: shop.id,
          status: 'approved',
          deleted_at: null,
        },
      }),
      prisma.ads.aggregate({
        where: {
          user_id: shop.id,
          status: 'approved',
          deleted_at: null,
        },
        _sum: {
          view_count: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...shop,
        stats: {
          totalAds: adsCount,
          totalViews: totalViews._sum.view_count || 0,
          memberSince: shop.createdAt
            ? new Date(shop.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })
            : null,
        },
      },
    });
  } catch (error) {
    console.error('Shop fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch shop' },
      { status: 500 }
    );
  }
}
