import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/user/category
 * Get user's default category and subcategory
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        default_category_id: true,
        default_subcategory_id: true,
        default_category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        default_subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        categoryId: user.default_category_id,
        subcategoryId: user.default_subcategory_id,
        category: user.default_category
          ? {
              id: user.default_category.id,
              name: user.default_category.name,
              slug: user.default_category.slug,
              icon: user.default_category.icon,
            }
          : null,
        subcategory: user.default_subcategory
          ? {
              id: user.default_subcategory.id,
              name: user.default_subcategory.name,
              slug: user.default_subcategory.slug,
              icon: user.default_subcategory.icon,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error('Get user category error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to get user category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/category
 * Update user's default category and subcategory
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const { categoryId, subcategoryId } = body;

    let finalCategoryId: number | null = null;
    let finalSubcategoryId: number | null = null;

    // Validate category if provided
    if (categoryId) {
      finalCategoryId = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;

      const category = await prisma.categories.findUnique({
        where: { id: finalCategoryId },
        select: { id: true, parent_id: true },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      // Ensure this is a parent category (no parent_id)
      if (category.parent_id !== null) {
        return NextResponse.json(
          { success: false, message: 'Please select a main category, not a subcategory' },
          { status: 400 }
        );
      }
    }

    // Validate subcategory if provided
    if (subcategoryId) {
      finalSubcategoryId = typeof subcategoryId === 'string' ? parseInt(subcategoryId) : subcategoryId;

      const subcategory = await prisma.categories.findUnique({
        where: { id: finalSubcategoryId },
        select: { id: true, parent_id: true },
      });

      if (!subcategory) {
        return NextResponse.json(
          { success: false, message: 'Subcategory not found' },
          { status: 404 }
        );
      }

      // Ensure subcategory belongs to the selected category
      if (finalCategoryId && subcategory.parent_id !== finalCategoryId) {
        return NextResponse.json(
          { success: false, message: 'Subcategory does not belong to the selected category' },
          { status: 400 }
        );
      }
    }

    // Update user's default category and subcategory
    await prisma.users.update({
      where: { id: userId },
      data: {
        default_category_id: finalCategoryId,
        default_subcategory_id: finalSubcategoryId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    console.error('Update user category error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    );
  }
}
