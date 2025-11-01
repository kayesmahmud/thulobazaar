import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/admin/categories
 * Create a new category
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - name: Category name
 * - parent_id: Parent category ID (optional, for subcategories)
 * - slug: URL slug (optional, auto-generated if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const body = await request.json();
    const { name, parent_id, slug } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    const categorySlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    // Check if slug already exists
    const existing = await prisma.categories.findFirst({
      where: { slug: categorySlug },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category with this slug already exists',
        },
        { status: 400 }
      );
    }

    // Create category
    const category = await prisma.categories.create({
      data: {
        name,
        slug: categorySlug,
        parent_id: parent_id ? parseInt(parent_id) : null,
      },
    });

    console.log('Created category:', category);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parent_id,
          createdAt: category.created_at,
        },
        message: 'Category created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Category creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create category',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
