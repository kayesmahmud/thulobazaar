import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/ads/my-ads
 * Get current user's ads with images
 *
 * Query params:
 * - status: 'approved' | 'pending' | 'rejected' (optional)
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user_id: userId,
      deleted_at: null, // Exclude deleted ads
    };

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.ads.count({ where });

    // Fetch user's ads with related data
    const ads = await prisma.ads.findMany({
      where,
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
        is_sticky: true,
        featured_until: true,
        urgent_until: true,
        sticky_until: true,
        created_at: true,
        updated_at: true,
        // Related data
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
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
          select: {
            id: true,
            filename: true,
            file_path: true,
            is_primary: true,
          },
          orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase and map status
    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      price: ad.price ? parseFloat(ad.price.toString()) : null,
      condition: ad.condition,
      status: ad.status === 'approved' ? 'active' : ad.status, // Map 'approved' to 'active' for dashboard
      slug: ad.slug,
      views: ad.view_count, // Map view_count to views for dashboard
      viewCount: ad.view_count,
      isFeatured: ad.is_featured,
      isUrgent: ad.is_urgent,
      isSticky: ad.is_sticky,
      featuredUntil: ad.featured_until,
      urgentUntil: ad.urgent_until,
      stickyUntil: ad.sticky_until,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      category: ad.categories
        ? {
            id: ad.categories.id,
            name: ad.categories.name,
            slug: ad.categories.slug,
            icon: ad.categories.icon,
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
      images: ad.ad_images.map((img) => ({
        id: img.id,
        filename: img.filename,
        filePath: img.file_path,
        isPrimary: img.is_primary,
      })),
      primaryImage: ad.ad_images[0]
        ? {
            id: ad.ad_images[0].id,
            filename: ad.ad_images[0].filename,
            filePath: ad.ad_images[0].file_path,
            isPrimary: ad.ad_images[0].is_primary,
          }
        : null,
    }));

    console.log(`✅ Found ${ads.length} ads for user ${userId}`);

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('My ads fetch error:', error);

    // Check for authentication errors
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
