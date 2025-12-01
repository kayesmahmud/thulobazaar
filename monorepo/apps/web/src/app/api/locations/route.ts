import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/locations
 * Get hierarchical locations (Province → District → Municipality → Area)
 *
 * Query params:
 * - type: 'province' | 'district' | 'municipality' | 'area' (optional)
 * - parentId: number (optional) - Get children of this location
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    // Support both camelCase (parentId) and snake_case (parent_id)
    const parentId = searchParams.get('parentId') || searchParams.get('parent_id');

    const where: any = {};

    // Filter by type if provided
    if (type) {
      where.type = type;
    }

    // Filter by parent if provided
    if (parentId) {
      where.parent_id = parseInt(parentId);
    } else if (!type) {
      // If no type and no parent, get root locations (provinces)
      where.type = 'province';
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
        created_at: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to camelCase
    const transformedLocations = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      parentId: loc.parent_id,
      slug: loc.slug,
      latitude: loc.latitude ? parseFloat(loc.latitude.toString()) : null,
      longitude: loc.longitude ? parseFloat(loc.longitude.toString()) : null,
      createdAt: loc.created_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedLocations,
        total: transformedLocations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Locations fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}
