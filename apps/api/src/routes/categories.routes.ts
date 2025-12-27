import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/categories
 * Get all categories with optional subcategories
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const { includeSubcategories } = req.query;

    console.log(`🔍 [Categories] includeSubcategories param:`, includeSubcategories);

    let categories;

    if (includeSubcategories === 'true') {
      // Get categories with subcategories (hierarchical)
      categories = await prisma.categories.findMany({
        where: { parent_id: null },
        include: {
          other_categories: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    } else {
      // Get categories with ad count
      categories = await prisma.$queryRaw`
        SELECT c.*, COUNT(a.id)::int as ad_count
        FROM categories c
        LEFT JOIN ads a ON c.id = a.category_id AND a.status = 'approved'
        WHERE c.parent_id IS NULL
        GROUP BY c.id
        ORDER BY c.name ASC
      `;
    }

    console.log(`✅ [Categories] Returning ${Array.isArray(categories) ? categories.length : 0} categories`);

    res.json({
      success: true,
      data: categories,
    });
  })
);

/**
 * GET /api/categories/:id
 * Get single category by ID or slug
 */
router.get(
  '/:id',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    let category;
    if (!isNaN(Number(id))) {
      category = await prisma.categories.findUnique({
        where: { id: parseInt(id) },
        include: {
          other_categories: {
            orderBy: { name: 'asc' },
          },
        },
      });
    } else {
      category = await prisma.categories.findFirst({
        where: { slug: id },
        include: {
          other_categories: {
            orderBy: { name: 'asc' },
          },
        },
      });
    }

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    res.json({
      success: true,
      category,
    });
  })
);

/**
 * POST /api/categories
 * Create category (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { name, icon, parent_id, form_template } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        icon: icon || null,
        parent_id: parent_id || null,
        form_template: form_template || null,
      },
    });

    console.log(`✅ Created category: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  })
);

/**
 * PUT /api/categories/:id
 * Update category (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, icon, form_template } = req.body;

    const existingCategory = await prisma.categories.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const category = await prisma.categories.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingCategory.name,
        slug,
        icon: icon !== undefined ? icon : existingCategory.icon,
        form_template: form_template !== undefined ? form_template : existingCategory.form_template,
      },
    });

    console.log(`✅ Updated category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  })
);

/**
 * DELETE /api/categories/:id
 * Delete category (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.categories.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await prisma.categories.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ Deleted category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

export default router;
