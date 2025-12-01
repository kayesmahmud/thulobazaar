import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/locations
 * List all locations with statistics
 * Requires: Editor or Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');

    // Build where clause
    const whereClause: any = {};
    if (typeFilter && typeFilter !== 'all') {
      whereClause.type = typeFilter;
    }

    // Fetch locations with counts
    const locations = await prisma.locations.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        parent_id: true,
        latitude: true,
        longitude: true,
        created_at: true,
        locations: true, // parent location
        _count: {
          select: {
            ads: {
              where: { deleted_at: null },
            },
            users: true,
            other_locations: true, // child locations
          },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    // Transform response
    const data = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      type: loc.type,
      parent_id: loc.parent_id,
      parent_name: loc.locations?.name || null,
      latitude: loc.latitude?.toString() || null,
      longitude: loc.longitude?.toString() || null,
      created_at: loc.created_at?.toISOString() || null,
      ad_count: String(loc._count.ads),
      user_count: String(loc._count.users),
      sublocation_count: String(loc._count.other_locations),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Location list error:', error);

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
        message: 'Failed to fetch locations',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/locations
 * Create a new location (province, district, municipality, or area)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - name: Location name
 * - type: 'province' | 'district' | 'municipality' | 'area'
 * - parent_id: Parent location ID (required for non-province types)
 * - slug: URL slug (optional, auto-generated if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const body = await request.json();
    const { name, type, parent_id, slug } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, message: 'Name and type are required' },
        { status: 400 }
      );
    }

    const validTypes = [
      'province',
      'district',
      'municipality',
      'metropolitan',
      'sub_metropolitan',
      'area',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Type must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    const locationSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    // Create location
    const location = await prisma.locations.create({
      data: {
        name,
        type,
        slug: locationSlug,
        parent_id: parent_id ? parseInt(parent_id) : null,
      },
    });

    console.log('Created location:', location);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: location.id,
          name: location.name,
          type: location.type,
          slug: location.slug,
          parentId: location.parent_id,
        },
        message: 'Location created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Location creation error:', error);

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
        message: 'Failed to create location',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
