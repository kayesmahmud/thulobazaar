const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// =====================================================
// SEARCH AREAS (Autocomplete)
// Route: GET /api/areas/search?q=thamel
// =====================================================
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const query = `
      SELECT
        area_id as id,
        area_name as name,
        area_name_np as name_np,
        ward_number,
        municipality_name,
        district_name,
        province_name,
        display_text,
        listing_count,
        is_popular,
        area_latitude as latitude,
        area_longitude as longitude
      FROM areas_full_hierarchy
      WHERE
        area_name ILIKE $1
        OR area_name_np ILIKE $1
        OR search_text ILIKE $1
        OR municipality_name ILIKE $1
        OR district_name ILIKE $1
        OR CAST(ward_number AS TEXT) ILIKE $1
      ORDER BY
        is_popular DESC,
        listing_count DESC,
        area_name ASC
      LIMIT $2
    `;

    const result = await pool.query(query, [`%${q}%`, parseInt(limit)]);

    console.log(`🔍 Area search for "${q}" found ${result.rows.length} results`);

    res.json({
      success: true,
      data: result.rows,
      query: q
    });

  } catch (error) {
    console.error('❌ Error searching areas:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching areas',
      error: error.message
    });
  }
});

// =====================================================
// GET POPULAR AREAS
// Route: GET /api/areas/popular
// =====================================================
router.get('/popular', async (req, res) => {
  try {
    const { municipality_id, limit = 10 } = req.query;

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

    const params = [];
    if (municipality_id) {
      query += ` AND municipality_id = $1`;
      params.push(parseInt(municipality_id));
    }

    query += `
      ORDER BY listing_count DESC, area_name ASC
      LIMIT $${params.length + 1}
    `;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    console.log(`⭐ Found ${result.rows.length} popular areas`);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching popular areas:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular areas',
      error: error.message
    });
  }
});

// =====================================================
// GET AREAS BY MUNICIPALITY/WARD
// Route: GET /api/areas/by-location?municipality_id=30101&ward=1
// =====================================================
router.get('/by-location', async (req, res) => {
  try {
    const { municipality_id, ward } = req.query;

    if (!municipality_id) {
      return res.status(400).json({
        success: false,
        message: 'municipality_id is required'
      });
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

    const params = [parseInt(municipality_id)];

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

    const result = await pool.query(query, params);

    console.log(`📍 Found ${result.rows.length} areas for municipality ${municipality_id}${ward ? ` ward ${ward}` : ''}`);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching areas by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching areas',
      error: error.message
    });
  }
});

// =====================================================
// GET LOCATION HIERARCHY WITH AREA COUNTS
// Route: GET /api/areas/hierarchy?province_id=3
// =====================================================
router.get('/hierarchy', async (req, res) => {
  try {
    const { province_id } = req.query;

    // If province_id is provided, get a simplified hierarchy for that province
    if (province_id) {
      // NEW: Use hierarchical locations table
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

      const [districtsResult, municipalitiesResult, wardsResult] = await Promise.all([
        pool.query(districtQuery, [parseInt(province_id)]),
        pool.query(municipalityQuery, [parseInt(province_id)]),
        pool.query(wardsQuery, [parseInt(province_id)])
      ]);

      // Build the hierarchy in JavaScript
      const districts = districtsResult.rows.map(district => {
        const municipalities = municipalitiesResult.rows
          .filter(m => m.parent_id === district.id)
          .map(municipality => {
            const wards = wardsResult.rows
              .filter(w => w.municipality_id === municipality.id)
              .map(ward => ({
                ward_number: ward.ward_number,
                areas: ward.areas || []
              }));

            return {
              id: municipality.id,
              name: municipality.name,
              type: municipality.type,
              area_count: municipality.area_count,
              wards: wards
            };
          });

        return {
          id: district.id,
          name: district.name,
          area_count: district.area_count,
          municipalities: municipalities
        };
      });

      console.log(`🗺️  Fetched hierarchy for province ${province_id}`);

      res.json({
        success: true,
        data: {
          province_id: parseInt(province_id),
          districts: districts
        }
      });

    } else {
      // Get all provinces with basic district counts
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

      const result = await pool.query(query);

      console.log(`🗺️  Fetched all provinces with counts`);

      res.json({
        success: true,
        data: result.rows
      });
    }

  } catch (error) {
    console.error('❌ Error fetching location hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location hierarchy',
      error: error.message
    });
  }
});

// =====================================================
// GET WARDS FOR MUNICIPALITY
// Route: GET /api/areas/wards?municipality_id=30101
// =====================================================
router.get('/wards', async (req, res) => {
  try {
    const { municipality_id } = req.query;

    if (!municipality_id) {
      return res.status(400).json({
        success: false,
        message: 'municipality_id is required'
      });
    }

    // NEW: Query the hierarchical locations table instead of old areas table
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

    const result = await pool.query(query, [parseInt(municipality_id)]);

    console.log(`🏘️  Found ${result.rows.length} wards for municipality ${municipality_id}`);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching wards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wards',
      error: error.message
    });
  }
});

module.exports = router;
