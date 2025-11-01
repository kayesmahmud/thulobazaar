import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/locations/search
 * Search locations by name
 *
 * Query params:
 * - q: string (required) - Search query
 * - type: 'province' | 'district' | 'municipality' | 'ward' (optional)
 * - limit: number (optional, default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Search query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const where: any = {
      name: {
        contains: query,
        mode: 'insensitive', // Case-insensitive search
      },
    };

    if (type) {
      where.type = type;
    }

    const locations = await prisma.locations.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        parent_id: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    // For each location, get the full hierarchy path
    const locationsWithHierarchy = await Promise.all(
      locations.map(async (loc) => {
        const hierarchy = await getLocationHierarchy(loc.id);

        return {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          parentId: loc.parent_id,
          slug: loc.slug,
          latitude: loc.latitude ? parseFloat(loc.latitude.toString()) : null,
          longitude: loc.longitude ? parseFloat(loc.longitude.toString()) : null,
          fullPath: hierarchy.map((h) => h.name).join(' → '),
          hierarchy,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: locationsWithHierarchy,
        total: locationsWithHierarchy.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to search locations',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get location hierarchy (breadcrumb trail)
 */
async function getLocationHierarchy(locationId: number) {
  const hierarchy: Array<{ id: number; name: string; type: string }> = [];
  let currentId: number | null = locationId;

  while (currentId !== null) {
    const location = await prisma.locations.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        type: true,
        parent_id: true,
      },
    });

    if (!location) break;

    hierarchy.unshift({
      id: location.id,
      name: location.name,
      type: location.type,
    });

    currentId = location.parent_id;
  }

  return hierarchy;
}
