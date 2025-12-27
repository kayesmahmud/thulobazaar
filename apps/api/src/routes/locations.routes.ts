import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

interface LocationWithCount {
  id: number;
  name: string;
  slug: string | null;
  type: string | null;
  parent_id: number | null;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
  ad_count: number;
}

/**
 * GET /api/locations
 * Get all locations with optional parent_id or type filter
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { parent_id, type } = req.query;

    let locations: LocationWithCount[];

    if (type !== undefined) {
      // Filter by location type
      locations = await prisma.$queryRaw<LocationWithCount[]>`
        SELECT l.*, COUNT(a.id)::int as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
        WHERE l.type = ${type as string}
        GROUP BY l.id
        ORDER BY l.name ASC
      `;
      console.log(`✅ Found ${locations.length} locations (type: ${type})`);
    } else if (parent_id !== undefined) {
      if (parent_id === '' || parent_id === 'null') {
        // Get top-level locations (provinces)
        locations = await prisma.$queryRaw<LocationWithCount[]>`
          SELECT l.*, COUNT(a.id)::int as ad_count
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
          WHERE l.parent_id IS NULL
          GROUP BY l.id
          ORDER BY l.name ASC
        `;
      } else {
        // Get children of specific parent
        locations = await prisma.$queryRaw<LocationWithCount[]>`
          SELECT l.*, COUNT(a.id)::int as ad_count
          FROM locations l
          LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
          WHERE l.parent_id = ${parseInt(parent_id as string)}
          GROUP BY l.id
          ORDER BY l.name ASC
        `;
      }
      console.log(`✅ Found ${locations.length} locations (parent_id: ${parent_id || 'NULL'})`);
    } else {
      // Fetch all locations
      locations = await prisma.$queryRaw<LocationWithCount[]>`
        SELECT l.*, COUNT(a.id)::int as ad_count
        FROM locations l
        LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
        GROUP BY l.id
        ORDER BY l.name ASC
      `;
      console.log(`✅ Found ${locations.length} locations`);
    }

    res.json({
      success: true,
      data: locations,
    });
  })
);

/**
 * GET /api/locations/hierarchy
 * Get complete location hierarchy
 */
router.get(
  '/hierarchy',
  catchAsync(async (_req: Request, res: Response) => {
    // Get all provinces (parent_id is null and type is 'province')
    const provinces = await prisma.locations.findMany({
      where: {
        parent_id: null,
        type: 'province',
      },
      orderBy: { name: 'asc' },
    });

    // Build hierarchy
    const hierarchy = await Promise.all(
      provinces.map(async (province) => {
        // Get districts for this province
        const districts = await prisma.locations.findMany({
          where: { parent_id: province.id, type: 'district' },
          orderBy: { name: 'asc' },
        });

        const districtsWithChildren = await Promise.all(
          districts.map(async (district) => {
            // Get municipalities for this district
            const municipalities = await prisma.locations.findMany({
              where: { parent_id: district.id },
              orderBy: { name: 'asc' },
            });

            const municipalitiesWithAreas = await Promise.all(
              municipalities.map(async (municipality) => {
                // Get areas directly under municipality (no ward level)
                const areas = await prisma.locations.findMany({
                  where: { parent_id: municipality.id, type: 'area' },
                  orderBy: { name: 'asc' },
                });

                return { ...municipality, areas };
              })
            );

            return { ...district, municipalities: municipalitiesWithAreas };
          })
        );

        return { ...province, districts: districtsWithChildren };
      })
    );

    const stats = {
      provinces: hierarchy.length,
      districts: hierarchy.reduce((sum, p) => sum + p.districts.length, 0),
      municipalities: hierarchy.reduce(
        (sum, p) => sum + p.districts.reduce((dSum, d) => dSum + d.municipalities.length, 0),
        0
      ),
    };

    console.log('📍 Location hierarchy stats:', stats);

    res.json({
      success: true,
      data: hierarchy,
      stats,
    });
  })
);

/**
 * GET /api/locations/search
 * Search areas/places with autocomplete
 */
router.get(
  '/search',
  catchAsync(async (req: Request, res: Response) => {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${(q as string).trim()}%`;
    const limitNum = parseInt(limit as string);

    const results = await prisma.$queryRaw`
      SELECT id, name, slug, type, parent_id
      FROM locations
      WHERE name ILIKE ${searchTerm}
      ORDER BY name ASC
      LIMIT ${limitNum}
    `;

    console.log(`🔍 Area search for "${q}": Found ${Array.isArray(results) ? results.length : 0} results`);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/locations/search-all
 * Search ALL location levels
 */
router.get(
  '/search-all',
  catchAsync(async (req: Request, res: Response) => {
    const { q, limit = '15' } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchTerm = `%${(q as string).trim()}%`;
    const limitNum = parseInt(limit as string);

    const results = await prisma.$queryRaw`
      SELECT id, name, slug, type, parent_id
      FROM locations
      WHERE name ILIKE ${searchTerm}
      ORDER BY
        CASE type
          WHEN 'province' THEN 1
          WHEN 'district' THEN 2
          WHEN 'municipality' THEN 3
          WHEN 'area' THEN 4
          ELSE 5
        END,
        name ASC
      LIMIT ${limitNum}
    `;

    console.log(`🔍 All-location search for "${q}": Found ${Array.isArray(results) ? results.length : 0} results`);

    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/locations/slug/:slug
 * Get location by slug
 */
router.get(
  '/slug/:slug',
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const location = await prisma.locations.findFirst({
      where: { slug },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.json({
      success: true,
      data: location,
    });
  })
);

/**
 * GET /api/locations/:id
 * Get single location by ID
 */
router.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    let location;
    if (!isNaN(Number(id))) {
      location = await prisma.locations.findUnique({
        where: { id: parseInt(id) },
      });
    } else {
      location = await prisma.locations.findFirst({
        where: { slug: id },
      });
    }

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    res.json({
      success: true,
      data: location,
    });
  })
);

/**
 * POST /api/locations
 * Create location (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { name, latitude, longitude, type, parent_id } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const location = await prisma.locations.create({
      data: {
        name,
        slug,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        type: type || null,
        parent_id: parent_id || null,
      },
    });

    console.log(`✅ Created location: ${location.name}`);

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location,
    });
  })
);

/**
 * PUT /api/locations/:id
 * Update location (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, latitude, longitude } = req.body;

    const existingLocation = await prisma.locations.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingLocation) {
      throw new NotFoundError('Location not found');
    }

    let slug = existingLocation.slug;
    if (name && name !== existingLocation.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const location = await prisma.locations.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingLocation.name,
        slug,
        latitude: latitude !== undefined ? parseFloat(latitude) : existingLocation.latitude,
        longitude: longitude !== undefined ? parseFloat(longitude) : existingLocation.longitude,
      },
    });

    console.log(`✅ Updated location: ${location.name}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location,
    });
  })
);

/**
 * DELETE /api/locations/:id
 * Delete location (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const location = await prisma.locations.findUnique({
      where: { id: parseInt(id) },
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    await prisma.locations.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ Deleted location: ${location.name}`);

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  })
);

export default router;
