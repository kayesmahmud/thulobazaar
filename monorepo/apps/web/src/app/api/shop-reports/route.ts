import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/shop-reports
 * Report a shop/seller for inappropriate behavior
 *
 * Body:
 * - shopId: number (required) - The user ID of the shop being reported
 * - reason: string (required) - 'fraud' | 'harassment' | 'fake_products' | 'poor_service' | 'impersonation' | 'other'
 * - details: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { shopId, reason, details } = body;

    // Validate required fields
    if (!shopId || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shop ID and reason are required',
        },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = ['fraud', 'harassment', 'fake_products', 'poor_service', 'impersonation', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get shop to check if it exists
    const shop = await prisma.users.findUnique({
      where: { id: parseInt(shopId, 10) },
      select: {
        id: true,
        full_name: true,
        business_name: true,
        is_active: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Prevent users from reporting themselves
    if (shop.id === userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You cannot report your own shop',
        },
        { status: 400 }
      );
    }

    // Check if user has already reported this shop
    const existingReport = await prisma.shop_reports.findFirst({
      where: {
        shop_id: shop.id,
        reporter_id: userId,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: 'You have already reported this shop',
        },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.shop_reports.create({
      data: {
        shop_id: shop.id,
        reporter_id: userId,
        reason,
        details: details || null,
        status: 'pending',
      },
    });

    console.log(
      `✅ Shop ${shop.id} (${shop.business_name || shop.full_name}) reported by user ${userId} for reason: ${reason}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Shop reported successfully. Our team will review it shortly.',
        data: {
          id: report.id,
          createdAt: report.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Shop report creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to report shop',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shop-reports
 * Get user's submitted shop reports
 *
 * Query params:
 * - status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' (optional)
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    // Build where clause (only show user's own reports)
    const where: any = {
      reporter_id: userId,
    };

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.shop_reports.count({ where });

    // Fetch reports with shop details
    const reports = await prisma.shop_reports.findMany({
      where,
      select: {
        id: true,
        shop_id: true,
        reporter_id: true,
        reason: true,
        details: true,
        status: true,
        admin_notes: true,
        created_at: true,
        updated_at: true,
        shop: {
          select: {
            id: true,
            full_name: true,
            business_name: true,
            avatar: true,
            shop_slug: true,
            custom_shop_slug: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedReports = reports.map((report) => ({
      id: report.id,
      shopId: report.shop_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      adminNotes: report.admin_notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      shop: {
        id: report.shop.id,
        fullName: report.shop.full_name,
        businessName: report.shop.business_name,
        avatar: report.shop.avatar,
        shopSlug: report.shop.custom_shop_slug || report.shop.shop_slug,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedReports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Shop reports fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch shop reports',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
