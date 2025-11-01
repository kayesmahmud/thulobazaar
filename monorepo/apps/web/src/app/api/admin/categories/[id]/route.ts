import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/categories/:id
 * Update a category
 * Requires: Editor or Super Admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { id } = await params;
    const categoryId = parseInt(id);
    const body = await request.json();
    const { name, parent_id, slug } = body;

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (parent_id !== undefined) {
      updateData.parent_id = parent_id ? parseInt(parent_id) : null;
    }

    // Update category
    const category = await prisma.categories.update({
      where: { id: categoryId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parent_id,
        },
        message: 'Category updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Category update error:', error);

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
        message: 'Failed to update category',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/:id
 * Delete a category
 * Requires: Editor or Super Admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { id } = await params;
    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has ads
    const adsCount = await prisma.ads.count({
      where: { category_id: categoryId, deleted_at: null },
    });

    if (adsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category with ${adsCount} active ads`,
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.categories.delete({
      where: { id: categoryId },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Category deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Category deletion error:', error);

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
        message: 'Failed to delete category',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
