import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/areas
 * Get areas with optional filtering
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { parent_id, type, limit = '100' } = req.query;

    const where: any = {};

    if (parent_id) {
      where.parent_id = parseInt(parent_id as string);
    }

    if (type) {
      where.type = type;
    }

    const areas = await prisma.locations.findMany({
      where,
      orderBy: { name: 'asc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: areas,
    });
  })
);

/**
 * GET /api/areas/search
 * Search areas by name
 */
router.get(
  '/search',
  catchAsync(async (req: Request, res: Response) => {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const areas = await prisma.locations.findMany({
      where: {
        name: { contains: q as string, mode: 'insensitive' },
        type: 'area',
      },
      orderBy: { name: 'asc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: areas,
    });
  })
);

/**
 * GET /api/areas/popular
 * Get popular areas (most ads)
 */
router.get(
  '/popular',
  catchAsync(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;

    const areas = await prisma.$queryRaw`
      SELECT l.*, COUNT(a.id)::int as ad_count
      FROM locations l
      LEFT JOIN ads a ON l.id = a.location_id AND a.status = 'approved'
      WHERE l.type = 'area' OR l.type = 'municipality'
      GROUP BY l.id
      HAVING COUNT(a.id) > 0
      ORDER BY ad_count DESC
      LIMIT ${parseInt(limit as string)}
    `;

    res.json({
      success: true,
      data: areas,
    });
  })
);

export default router;
