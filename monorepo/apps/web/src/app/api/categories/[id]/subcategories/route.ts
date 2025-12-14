import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/categories/[id]/subcategories
 * Get subcategories for a parent category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Get subcategories (children) of this category
    const subcategories = await prisma.categories.findMany({
      where: {
        parent_id: categoryId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: subcategories,
    });
  } catch (error: any) {
    console.error('Get subcategories error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to get subcategories' },
      { status: 500 }
    );
  }
}
