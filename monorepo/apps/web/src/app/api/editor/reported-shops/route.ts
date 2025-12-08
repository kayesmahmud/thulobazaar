import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/editor/reported-shops
 * Get shop reports for editor dashboard
 * Requires: Editor or Super Admin role
 *
 * Query params:
 * - status: 'pending' | 'resolved' | 'dismissed' (default: all)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.shop_reports.count({ where });

    // Fetch reports with shop, reporter, and resolver details
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
        resolved_by: true,
        created_at: true,
        updated_at: true,
        shop: {
          select: {
            id: true,
            full_name: true,
            business_name: true,
            email: true,
            avatar: true,
            shop_slug: true,
            custom_shop_slug: true,
            is_active: true,
            account_type: true,
            business_verification_status: true,
            individual_verified: true,
          },
        },
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar: true,
          },
        },
        resolver: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase for frontend
    const transformedReports = reports.map((report) => ({
      reportId: report.id,
      shopId: report.shop_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      description: report.details,
      status: report.status,
      adminNotes: report.admin_notes,
      resolvedBy: report.resolved_by,
      reportedAt: report.created_at,
      updatedAt: report.updated_at,
      // Shop details
      shopName: report.shop.business_name || report.shop.full_name,
      shopEmail: report.shop.email,
      shopAvatar: report.shop.avatar,
      shopSlug: report.shop.custom_shop_slug || report.shop.shop_slug,
      shopIsActive: report.shop.is_active,
      shopAccountType: report.shop.account_type,
      shopVerificationStatus: report.shop.business_verification_status,
      shopIndividualVerified: report.shop.individual_verified,
      // Reporter details
      reporterName: report.reporter.full_name,
      reporterEmail: report.reporter.email,
      reporterAvatar: report.reporter.avatar,
      // Resolver (editor) details
      resolverName: report.resolver?.full_name || null,
      resolverEmail: report.resolver?.email || null,
      resolverRole: report.resolver?.role || null,
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
    console.error('Reported shops fetch error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

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
        message: 'Failed to fetch reported shops',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
