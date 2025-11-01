import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/ads
 * Get ads list for editor dashboard (with filters)
 * Requires: Editor or Super Admin role
 *
 * Query params:
 * - status: 'pending' | 'approved' | 'rejected' (optional)
 * - category: number (optional)
 * - location: number (optional)
 * - search: string (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - sortBy: 'created_at' | 'updated_at' | 'view_count' (default: 'created_at')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category_id = parseInt(category);
    }
    if (location) {
      where.location_id = parseInt(location);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.ads.count({ where });

    // Fetch ads
    const ads = await prisma.ads.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        condition: true,
        status: true,
        view_count: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        reviewed_by: true,
        reviewed_at: true,
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
          },
        },
        users_ads_user_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true,
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
      orderBy: { [sortBy]: sortOrder },
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
      status: ad.status,
      viewCount: ad.view_count,
      createdAt: ad.created_at,
      updatedAt: ad.updated_at,
      deletedAt: ad.deleted_at,
      reviewedBy: ad.reviewed_by,
      reviewedAt: ad.reviewed_at,
      categoryName: ad.categories?.name || 'N/A',
      locationName: ad.locations?.name || 'N/A',
      sellerName: ad.users_ads_user_idTousers?.full_name || 'Unknown',
      sellerEmail: ad.users_ads_user_idTousers?.email || 'N/A',
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
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin ads fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch ads',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
