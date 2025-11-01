import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/admin/locations
 * Create a new location (province, district, municipality, ward, or area)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - name: Location name
 * - type: 'province' | 'district' | 'municipality' | 'ward' | 'area'
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
      'ward',
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
