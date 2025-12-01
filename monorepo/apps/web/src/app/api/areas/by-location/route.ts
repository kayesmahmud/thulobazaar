import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/areas/by-location
 * Get areas by municipality
 *
 * Query params:
 * - municipality_id: Municipality ID (required)
 *
 * Note: Uses locations table with type='area'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const municipality_id = searchParams.get('municipality_id');

    if (!municipality_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'municipality_id is required',
        },
        { status: 400 }
      );
    }

    // Get areas directly under the municipality
    const areas = await prisma.locations.findMany({
      where: {
        parent_id: parseInt(municipality_id),
        type: 'area',
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: areas,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Areas by location fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching areas',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
