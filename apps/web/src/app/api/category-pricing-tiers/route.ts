import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

// Valid pricing tiers
const VALID_TIERS = ['default', 'electronics', 'vehicles', 'property'];

/**
 * GET /api/category-pricing-tiers
 * Get all category-to-tier mappings (public endpoint)
 */
export async function GET() {
  try {
    const mappings = await prisma.category_pricing_tiers.findMany({
      where: { is_active: true },
      select: {
        id: true,
        category_id: true,
        category_name: true,
        pricing_tier: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { category_name: 'asc' },
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
      categoryName: m.category_name,
      pricingTier: m.pricing_tier,
      isActive: m.is_active,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          mappings: transformedMappings,
          categories,
          tiers: VALID_TIERS,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Category pricing tiers fetch error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch category pricing tiers',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/category-pricing-tiers
 * Create or update category-to-tier mapping
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - category_name: string (required)
 * - category_id: number (optional)
 * - pricing_tier: 'default' | 'electronics' | 'vehicles' | 'property' (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { category_name, category_id, pricing_tier } = body;

    // Validate required fields
    if (!category_name || !pricing_tier) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category name and pricing tier are required',
        },
        { status: 400 }
      );
    }

    // Validate pricing tier
    if (!VALID_TIERS.includes(pricing_tier)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid pricing tier. Must be: default, electronics, vehicles, or property',
        },
        { status: 400 }
      );
    }

    // Check if mapping already exists for this category
    const existingMapping = await prisma.category_pricing_tiers.findFirst({
      where: { category_name },
    });

    let result;
    if (existingMapping) {
      // Update existing mapping
      result = await prisma.category_pricing_tiers.update({
        where: { id: existingMapping.id },
        data: {
          pricing_tier,
          category_id: category_id || null,
          is_active: true,
          updated_at: new Date(),
        },
      });
    } else {
      // Create new mapping
      result = await prisma.category_pricing_tiers.create({
        data: {
          category_name,
          category_id: category_id || null,
          pricing_tier,
          is_active: true,
        },
      });
    }

    console.log(`✅ Category pricing tier ${existingMapping ? 'updated' : 'created'} by editor ${editor.userId}:`, result);

    return NextResponse.json(
      {
        success: true,
        message: `Category pricing tier ${existingMapping ? 'updated' : 'created'} successfully`,
        data: {
          id: result.id,
          categoryId: result.category_id,
          categoryName: result.category_name,
          pricingTier: result.pricing_tier,
          isActive: result.is_active,
        },
      },
      { status: existingMapping ? 200 : 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Category pricing tier creation error:', err);

    if (err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (err.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create category pricing tier',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/category-pricing-tiers
 * Remove category-to-tier mapping (reverts to default tier)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - category_name: string (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { category_name } = body;

    if (!category_name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category name is required',
        },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const result = await prisma.category_pricing_tiers.updateMany({
      where: { category_name },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Category mapping not found',
        },
        { status: 404 }
      );
    }

    console.log(`✅ Category pricing tier deleted by editor ${editor.userId}: ${category_name}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Category pricing tier removed successfully (will use default tier)',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Category pricing tier deletion error:', err);

    if (err.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (err.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete category pricing tier',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
