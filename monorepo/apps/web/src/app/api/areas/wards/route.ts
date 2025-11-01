import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/areas/wards
 * Get wards with areas for a municipality
 *
 * Query params:
 * - municipality_id: Municipality ID (required)
 *
 * Returns wards with their areas and listing counts
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

    const query = `
      WITH area_listings AS (
        SELECT
          a.id,
          a.name,
          a.slug,
          a.parent_id,
          COUNT(ads.id) FILTER (WHERE ads.status = 'approved') as listing_count
        FROM locations a
        LEFT JOIN ads ON ads.location_id = a.id
        WHERE a.type = 'area'
        GROUP BY a.id, a.name, a.slug, a.parent_id
      )
      SELECT
        w.id as ward_id,
        w.name as ward_name,
        w.slug as ward_slug,
        CAST(REPLACE(w.name, 'Ward ', '') AS INTEGER) as ward_number,
        COUNT(al.id) as area_count,
        COALESCE(SUM(al.listing_count), 0) as total_listings,
        json_agg(
          json_build_object(
            'id', al.id,
            'name', al.name,
            'slug', al.slug,
            'listing_count', COALESCE(al.listing_count, 0),
            'is_popular', false
          ) ORDER BY al.name
        ) FILTER (WHERE al.id IS NOT NULL) as areas
      FROM locations w
      LEFT JOIN area_listings al ON al.parent_id = w.id
      WHERE w.parent_id = $1 AND w.type = 'ward'
      GROUP BY w.id, w.name, w.slug
      ORDER BY CAST(REPLACE(w.name, 'Ward ', '') AS INTEGER)
    `;

    const rawResults: any = await prisma.$queryRawUnsafe(
      query,
      parseInt(municipality_id)
    );

    // Convert BigInt to Number for JSON serialization
    const results = (rawResults as any[]).map((row: any) => ({
      ...row,
      ward_number: Number(row.ward_number),
      area_count: Number(row.area_count),
      total_listings: Number(row.total_listings),
    }));

    return NextResponse.json(
      {
        success: true,
        data: results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Wards fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching wards',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
