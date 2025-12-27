import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/categories
 * Get all categories with optional subcategories
 *
 * Query params:
 * - includeSubcategories: boolean (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('includeSubcategories') !== 'false';

    // Get all parent categories (parent_id is null)
    const parentCategories = await prisma.categories.findMany({
      where: {
        parent_id: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        form_template: true,
        created_at: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // If includeSubcategories, fetch subcategories for each parent
    const categoriesWithSubs = await Promise.all(
      parentCategories.map(async (parent) => {
        const subcategories = includeSubcategories
          ? await prisma.categories.findMany({
              where: {
                parent_id: parent.id,
              },
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                form_template: true,
                parent_id: true,
                created_at: true,
              },
              orderBy: {
                name: 'asc',
              },
            })
          : [];

        // Transform to camelCase
        return {
          id: parent.id,
          name: parent.name,
          slug: parent.slug,
          icon: parent.icon,
          formTemplate: parent.form_template,
          createdAt: parent.created_at,
          subcategories: subcategories.map((sub) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            icon: sub.icon,
            formTemplate: sub.form_template,
            parentId: sub.parent_id,
            createdAt: sub.created_at,
          })),
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: categoriesWithSubs,
        total: categoriesWithSubs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch categories',
      },
      { status: 500 }
    );
  }
}
