import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/areas/by-location
 * Get areas by municipality and/or ward
 *
 * Query params:
 * - municipality_id: Municipality ID (required)
 * - ward: Ward number (optional)
 *
 * Note: Uses old areas table directly
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const municipality_id = searchParams.get('municipality_id');
    const ward = searchParams.get('ward');

    if (!municipality_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'municipality_id is required',
        },
        { status: 400 }
      );
    }

    let query = `
      SELECT
        id,
        name,
        name_np,
        ward_number,
        listing_count,
        is_popular,
        latitude,
        longitude
      FROM areas
      WHERE municipality_id = $1
    `;

    const params: any[] = [parseInt(municipality_id)];

    if (ward) {
      query += ` AND ward_number = $2`;
      params.push(parseInt(ward));
    }

    query += `
      ORDER BY
        is_popular DESC,
        listing_count DESC,
        name ASC
    `;

    const results = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(
      {
        success: true,
        data: results,
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
