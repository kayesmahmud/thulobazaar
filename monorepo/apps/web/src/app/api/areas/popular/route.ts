import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/areas/popular
 * Get popular areas (most listings)
 *
 * Query params:
 * - municipality_id: Filter by municipality (optional)
 * - limit: Results limit (default: 10)
 *
 * Note: Uses areas_full_hierarchy view from old schema
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const municipality_id = searchParams.get('municipality_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    let query = `
      SELECT
        area_id as id,
        area_name as name,
        area_name_np as name_np,
        ward_number,
        municipality_name,
        municipality_id,
        district_name,
        province_name,
        display_text,
        listing_count,
        area_latitude as latitude,
        area_longitude as longitude
      FROM areas_full_hierarchy
      WHERE is_popular = true
    `;

    const params: any[] = [];
    if (municipality_id) {
      query += ` AND municipality_id = $1`;
      params.push(parseInt(municipality_id));
    }

    query += `
      ORDER BY listing_count DESC, area_name ASC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const results = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(
      {
        success: true,
        data: results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Popular areas fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching popular areas',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
