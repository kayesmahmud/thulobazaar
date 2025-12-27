/**
 * Category Pricing Tiers Routes
 * Manage category-to-pricing-tier mappings
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken, requireEditorOrAdmin } from '../middleware/auth';

const router = Router();

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/category-pricing-tiers
 * Get all category-to-tier mappings (public endpoint)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const mappings = await prisma.category_pricing_tiers.findMany({
      select: {
        id: true,
        category_id: true,
        pricing_tier: true,
        created_at: true,
        updated_at: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { category_id: 'asc' },
    });

    // Also get all root categories for the UI
    const categories = await prisma.categories.findMany({
      where: { parent_id: null },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    // Transform to camelCase
    const transformedMappings = mappings.map((m) => ({
      id: m.id,
      categoryId: m.category_id,
      categoryName: m.categories?.name || 'Unknown',
      categorySlug: m.categories?.slug || '',
      pricingTier: m.pricing_tier,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    res.json({
      success: true,
      data: {
        mappings: transformedMappings,
        categories,
        tiers: VALID_TIERS,
      },
    });
  } catch (error) {
    console.error('Category pricing tiers fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category pricing tiers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/category-pricing-tiers
 * Create or update category-to-tier mapping
 * Requires: Editor or Super Admin role
 */
router.post('/', authenticateToken, requireEditorOrAdmin, async (req: Request, res: Response) => {
  try {
    const editorId = req.user!.userId;
    const { category_id, pricing_tier } = req.body;

    // Validate required fields
    if (!category_id || !pricing_tier) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and pricing tier are required',
      });
    }

    // Validate pricing tier
    if (!VALID_TIERS.includes(pricing_tier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pricing tier. Must be: default, electronics, vehicles, or property',
      });
    }

    // Check if category exists
    const category = await prisma.categories.findUnique({
      where: { id: parseInt(category_id) },
      select: { id: true, name: true },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if mapping already exists for this category
    const existingMapping = await prisma.category_pricing_tiers.findUnique({
      where: { category_id: parseInt(category_id) },
    });

    let result;
    if (existingMapping) {
      // Update existing mapping
      result = await prisma.category_pricing_tiers.update({
        where: { id: existingMapping.id },
        data: {
          pricing_tier,
          updated_at: new Date(),
        },
        include: {
          categories: {
            select: { name: true, slug: true },
          },
        },
      });
    } else {
      // Create new mapping
      result = await prisma.category_pricing_tiers.create({
        data: {
          category_id: parseInt(category_id),
          pricing_tier,
        },
        include: {
          categories: {
            select: { name: true, slug: true },
          },
        },
      });
    }

    console.log(`✅ Category pricing tier ${existingMapping ? 'updated' : 'created'} by editor ${editorId}:`, result);

    res.status(existingMapping ? 200 : 201).json({
      success: true,
      message: `Category pricing tier ${existingMapping ? 'updated' : 'created'} successfully`,
      data: {
        id: result.id,
        categoryId: result.category_id,
        categoryName: result.categories?.name,
        pricingTier: result.pricing_tier,
      },
    });
  } catch (error) {
    console.error('Category pricing tier creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category pricing tier',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/category-pricing-tiers/:categoryId
 * Remove category-to-tier mapping (reverts to default tier)
 * Requires: Editor or Super Admin role
 */
router.delete('/:categoryId', authenticateToken, requireEditorOrAdmin, async (req: Request, res: Response) => {
  try {
    const editorId = req.user!.userId;
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required',
      });
    }

    // Delete the mapping
    try {
      await prisma.category_pricing_tiers.delete({
        where: { category_id: parseInt(categoryId) },
      });

      console.log(`✅ Category pricing tier deleted by editor ${editorId}: category ${categoryId}`);

      res.json({
        success: true,
        message: 'Category pricing tier removed successfully (will use default tier)',
      });
    } catch (deleteError: unknown) {
      // Handle not found error
      const err = deleteError as { code?: string };
      if (err.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Category mapping not found',
        });
      }
      throw deleteError;
    }
  } catch (error) {
    console.error('Category pricing tier deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category pricing tier',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/category-pricing-tiers/:categoryId
 * Get pricing tier for a specific category
 */
router.get('/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const mapping = await prisma.category_pricing_tiers.findUnique({
      where: { category_id: parseInt(categoryId) },
      select: {
        id: true,
        category_id: true,
        pricing_tier: true,
        categories: {
          select: { name: true, slug: true },
        },
      },
    });

    if (!mapping) {
      // Return default tier if no mapping found
      return res.json({
        success: true,
        data: {
          categoryId: parseInt(categoryId),
          pricingTier: 'default',
          isDefault: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: mapping.id,
        categoryId: mapping.category_id,
        categoryName: mapping.categories?.name,
        pricingTier: mapping.pricing_tier,
        isDefault: false,
      },
    });
  } catch (error) {
    console.error('Category pricing tier fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category pricing tier',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
