import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * POST /api/reports
 * Report an ad for inappropriate content
 *
 * Body:
 * - adId: number (required)
 * - reason: string (required) - 'spam' | 'fraud' | 'inappropriate' | 'duplicate' | 'other'
 * - details: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { adId, reason, details } = body;

    // Validate required fields
    if (!adId || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ad ID and reason are required',
        },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = ['spam', 'fraud', 'inappropriate', 'duplicate', 'misleading', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get ad to check if it exists and if user is the owner
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(adId) },
      select: {
        id: true,
        user_id: true,
        title: true,
        status: true,
      },
    });

    if (!ad) {
      return NextResponse.json(
        { success: false, message: 'Ad not found' },
        { status: 404 }
      );
    }

    // Prevent users from reporting their own ads
    if (ad.user_id === userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'You cannot report your own ad',
        },
        { status: 400 }
      );
    }

    // Check if user has already reported this ad
    const existingReport = await prisma.ad_reports.findFirst({
      where: {
        ad_id: ad.id,
        reporter_id: userId,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: 'You have already reported this ad',
        },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.ad_reports.create({
      data: {
        ad_id: ad.id,
        reporter_id: userId,
        reason,
        details: details || null,
        status: 'pending',
      },
    });

    console.log(
      `✅ Ad ${ad.id} reported by user ${userId} for reason: ${reason}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Ad reported successfully. Our team will review it shortly.',
        data: {
          id: report.id,
          createdAt: report.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Report creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to report ad',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * Get user's submitted reports (or all reports for admin)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build where clause (only show user's own reports)
    const where: any = {
      reporter_id: userId,
    };

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.ad_reports.count({ where });

    // Fetch reports with ad details
    const reports = await prisma.ad_reports.findMany({
      where,
      select: {
        id: true,
        ad_id: true,
        reporter_id: true,
        reason: true,
        details: true,
        status: true,
        admin_notes: true,
        created_at: true,
        updated_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            status: true,
            slug: true,
            ad_images: {
              where: { is_primary: true },
              select: {
                file_path: true,
              },
              take: 1,
            },
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
      adId: report.ad_id,
      reporterId: report.reporter_id,
      reason: report.reason,
      details: report.details,
      status: report.status,
      adminNotes: report.admin_notes,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      ad: {
        id: report.ads.id,
        title: report.ads.title,
        status: report.ads.status,
        slug: report.ads.slug,
        primaryImage: report.ads.ad_images[0]?.file_path || null,
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
    console.error('Reports fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch reports',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
