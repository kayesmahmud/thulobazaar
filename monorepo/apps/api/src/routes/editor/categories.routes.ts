import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/editor/categories
 * Get all categories with subcategories for admin management
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const categories = await prisma.categories.findMany({
      where: { parent_id: null },
      include: {
        other_categories: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { ads: true },
            },
          },
        },
        _count: {
          select: { ads: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const categoriesWithCounts = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      parentId: cat.parent_id,
      formTemplate: cat.form_template,
      adCount: cat._count.ads,
      subcategories: cat.other_categories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        icon: sub.icon,
        parentId: sub.parent_id,
        formTemplate: sub.form_template,
        adCount: sub._count.ads,
      })),
    }));

    console.log(`✅ [Admin] Retrieved ${categories.length} categories`);

    res.json({
      success: true,
      data: categoriesWithCounts,
    });
  })
);

/**
 * POST /api/editor/categories
 * Create a new category
 */
router.post(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { name, icon, parent_id, form_template } = req.body;

    if (!name) {
      throw new ValidationError('Category name is required');
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await prisma.categories.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new ValidationError('A category with this name already exists');
    }

    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        icon: icon || null,
        parent_id: parent_id || null,
        form_template: form_template || null,
      },
    });

    console.log(`✅ [Admin] Created category: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        parentId: category.parent_id,
        formTemplate: category.form_template,
      },
    });
  })
);

/**
 * PUT /api/editor/categories/:id
 * Update a category
 */
router.put(
  '/:id',
  authenticateToken,
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

      const slugExists = await prisma.categories.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) },
        },
      });

      if (slugExists) {
        throw new ValidationError('A category with this name already exists');
      }
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

    console.log(`✅ [Admin] Updated category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        parentId: category.parent_id,
        formTemplate: category.form_template,
      },
    });
  })
);

/**
 * DELETE /api/editor/categories/:id
 * Delete a category
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.categories.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            ads: true,
            other_categories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category._count.ads > 0) {
      throw new ValidationError(
        `Cannot delete category with ${category._count.ads} ads. Please move or delete the ads first.`
      );
    }

    if (category._count.other_categories > 0) {
      throw new ValidationError(
        `Cannot delete category with ${category._count.other_categories} subcategories. Please delete subcategories first.`
      );
    }

    await prisma.categories.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ [Admin] Deleted category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

export default router;
