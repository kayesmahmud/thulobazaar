import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/areas/hierarchy
 * Get location hierarchy with area counts
 *
 * Query params:
 * - province_id: Province ID (optional)
 *
 * If province_id provided: Returns districts -> municipalities -> wards -> areas for that province
 * If no province_id: Returns all provinces with basic counts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const province_id = searchParams.get('province_id');

    if (province_id) {
      // Get detailed hierarchy for specific province
      const districtQuery = `
        SELECT
          d.id,
          d.name,
          d.parent_id,
          COUNT(DISTINCT areas.id) as area_count
        FROM locations d
        LEFT JOIN locations m ON m.parent_id = d.id AND m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
        LEFT JOIN locations wards ON wards.parent_id = m.id AND wards.type = 'ward'
        LEFT JOIN locations areas ON areas.parent_id = wards.id AND areas.type = 'area'
        WHERE d.parent_id = $1 AND d.type = 'district'
        GROUP BY d.id, d.name, d.parent_id
        ORDER BY d.name
      `;

      const municipalityQuery = `
        SELECT
          m.id,
          m.name,
          m.type,
          m.parent_id,
          COUNT(DISTINCT areas.id) as area_count
        FROM locations m
        LEFT JOIN locations wards ON wards.parent_id = m.id AND wards.type = 'ward'
        LEFT JOIN locations areas ON areas.parent_id = wards.id AND areas.type = 'area'
        WHERE m.parent_id IN (
          SELECT id FROM locations WHERE parent_id = $1 AND type = 'district'
        )
        AND m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
        GROUP BY m.id, m.name, m.type, m.parent_id
        ORDER BY m.name
      `;

      const wardsQuery = `
        WITH area_listings AS (
          SELECT
            areas.id,
            areas.name,
            areas.parent_id as ward_id,
            COUNT(ads.id) FILTER (WHERE ads.status = 'approved') as listing_count
          FROM locations areas
          LEFT JOIN ads ON ads.location_id = areas.id
          WHERE areas.type = 'area'
            AND areas.parent_id IN (
              SELECT wards.id FROM locations wards
              WHERE wards.type = 'ward'
                AND wards.parent_id IN (
                  SELECT m.id FROM locations m
                  WHERE m.parent_id IN (
                    SELECT id FROM locations WHERE parent_id = $1 AND type = 'district'
                  )
                  AND m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
                )
            )
          GROUP BY areas.id, areas.name, areas.parent_id
        )
        SELECT
          CAST(REPLACE(wards.name, 'Ward ', '') AS INTEGER) as ward_number,
          wards.parent_id as municipality_id,
          json_agg(
            json_build_object(
              'id', al.id,
              'name', al.name,
              'listing_count', COALESCE(al.listing_count, 0),
              'is_popular', false
            ) ORDER BY al.name
          ) as areas
        FROM locations wards
        LEFT JOIN area_listings al ON al.ward_id = wards.id
        WHERE wards.type = 'ward'
          AND wards.parent_id IN (
            SELECT m.id FROM locations m
            WHERE m.parent_id IN (
              SELECT id FROM locations WHERE parent_id = $1 AND type = 'district'
            )
            AND m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
          )
        GROUP BY wards.id, wards.name, wards.parent_id
        ORDER BY wards.parent_id, CAST(REPLACE(wards.name, 'Ward ', '') AS INTEGER)
      `;

      const [districtsRaw, municipalitiesRaw, wardsRaw]: any[] =
        await Promise.all([
          prisma.$queryRawUnsafe(districtQuery, parseInt(province_id)),
          prisma.$queryRawUnsafe(municipalityQuery, parseInt(province_id)),
          prisma.$queryRawUnsafe(wardsQuery, parseInt(province_id)),
        ]);

      // Convert BigInt to Number
      const districtsResult = (districtsRaw as any[]).map((d: any) => ({
        ...d,
        area_count: Number(d.area_count),
      }));
      const municipalitiesResult = (municipalitiesRaw as any[]).map((m: any) => ({
        ...m,
        area_count: Number(m.area_count),
      }));
      const wardsResult = (wardsRaw as any[]).map((w: any) => ({
        ...w,
        ward_number: Number(w.ward_number),
      }));

      // Build the hierarchy in JavaScript
      const districts = (districtsResult as any[]).map((district) => {
        const municipalities = (municipalitiesResult as any[])
          .filter((m: any) => m.parent_id === district.id)
          .map((municipality: any) => {
            const wards = (wardsResult as any[])
              .filter((w: any) => w.municipality_id === municipality.id)
              .map((ward: any) => ({
                ward_number: ward.ward_number,
                areas: ward.areas || [],
              }));

            return {
              id: municipality.id,
              name: municipality.name,
              type: municipality.type,
              area_count: Number(municipality.area_count),
              wards: wards,
            };
          });

        return {
          id: district.id,
          name: district.name,
          area_count: Number(district.area_count),
          municipalities: municipalities,
        };
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            province_id: parseInt(province_id),
            districts: districts,
          },
        },
        { status: 200 }
      );
    } else {
      // Get all provinces with basic counts
      const query = `
        SELECT
          p.id,
          p.name,
          COUNT(DISTINCT d.id) as district_count,
          COUNT(DISTINCT m.id) as municipality_count,
          COUNT(DISTINCT areas.id) as area_count,
          COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'approved') as ad_count
        FROM locations p
        LEFT JOIN locations d ON d.parent_id = p.id AND d.type = 'district'
        LEFT JOIN locations m ON m.parent_id = d.id AND m.type IN ('municipality', 'metropolitan', 'sub_metropolitan')
        LEFT JOIN locations wards ON wards.parent_id = m.id AND wards.type = 'ward'
        LEFT JOIN locations areas ON areas.parent_id = wards.id AND areas.type = 'area'
        LEFT JOIN ads a ON a.location_id = areas.id
        WHERE p.type = 'province'
        GROUP BY p.id, p.name
        ORDER BY p.name
      `;

      const rawResults: any = await prisma.$queryRawUnsafe(query);

      // Convert BigInt to Number for JSON serialization
      const results = (rawResults as any[]).map((row: any) => ({
        ...row,
        district_count: Number(row.district_count),
        municipality_count: Number(row.municipality_count),
        area_count: Number(row.area_count),
        ad_count: Number(row.ad_count),
      }));

      return NextResponse.json(
        {
          success: true,
          data: results,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Location hierarchy fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching location hierarchy',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
