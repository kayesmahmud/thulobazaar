import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/areas/search
 * Search areas with autocomplete (for location filtering)
 *
 * Query params:
 * - q: Search query (min 2 characters)
 * - limit: Results limit (default: 10)
 *
 * Returns areas with hierarchy info (area -> ward -> municipality -> district -> province)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (!q || q.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Search query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    // Raw SQL query to get hierarchical area info with listing counts
    const query = `
      WITH area_search AS (
        SELECT
          areas.id,
          areas.name,
          'area' as type,
          wards.name as ward_name,
          CAST(REPLACE(wards.name, 'Ward ', '') AS INTEGER) as ward_number,
          m.name as municipality_name,
          d.name as district_name,
          p.name as province_name,
          areas.name || ', Ward ' || REPLACE(wards.name, 'Ward ', '') || ', ' || m.name || ', ' || d.name as hierarchy_info,
          COUNT(ads.id) FILTER (WHERE ads.status = 'approved') as listing_count
        FROM locations areas
        LEFT JOIN locations wards ON areas.parent_id = wards.id AND wards.type = 'ward'
        LEFT JOIN locations m ON wards.parent_id = m.id AND m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
        LEFT JOIN locations d ON m.parent_id = d.id AND d.type = 'district'
        LEFT JOIN locations p ON d.parent_id = p.id AND p.type = 'province'
        LEFT JOIN ads ON ads.location_id = areas.id
        WHERE areas.type = 'area'
          AND areas.name ILIKE $1
        GROUP BY areas.id, areas.name, wards.name, m.name, d.name, p.name
        ORDER BY listing_count DESC, areas.name ASC
        LIMIT $2
      )
      SELECT * FROM area_search
    `;

    const rawResults: any = await prisma.$queryRawUnsafe(query, `%${q}%`, limit);

    // Convert BigInt to Number for JSON serialization
    const results = (rawResults as any[]).map((row: any) => ({
      ...row,
      listing_count: row.listing_count ? Number(row.listing_count) : 0,
      ward_number: row.ward_number ? Number(row.ward_number) : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: results,
        query: q,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Area search error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error searching areas',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
