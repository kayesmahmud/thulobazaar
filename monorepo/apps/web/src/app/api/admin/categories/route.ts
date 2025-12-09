import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/categories
 * List all categories (flat list with parent_id for hierarchy)
 * Requires: Editor or Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    // Fetch all categories with counts
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        parent_id: true,
        form_template: true,
        created_at: true,
        categories: true, // parent category (self-relation)
        _count: {
          select: {
            ads: {
              where: { deleted_at: null },
            },
            other_categories: true, // child categories
          },
        },
      },
      orderBy: [{ parent_id: 'asc' }, { name: 'asc' }],
    });

    // Transform response - flat list like locations
    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      parent_id: cat.parent_id,
      parent_name: cat.categories?.name || null,
      form_template: cat.form_template,
      created_at: cat.created_at?.toISOString() || null,
      ad_count: String(cat._count.ads),
      subcategory_count: String(cat._count.other_categories),
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Category list error:', error);

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
        message: 'Failed to fetch categories',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/categories
 * Create a new category
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - name: Category name
 * - parent_id: Parent category ID (optional, for subcategories)
 * - slug: URL slug (optional, auto-generated if not provided)
 * - icon: Emoji icon (optional)
 * - form_template: Form template name (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const body = await request.json();
    const { name, parent_id, slug, icon, form_template } = body;

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
        icon: icon || null,
        form_template: form_template || null,
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
          icon: category.icon,
          parent_id: category.parent_id,
          form_template: category.form_template,
          created_at: category.created_at,
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
