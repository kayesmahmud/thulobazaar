import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/editor/reported-shops/[id]/suspend
 * Suspend a shop based on a report
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - shopId: number (required) - The user ID of the shop to suspend
 * - reason: string (required) - Reason for suspension
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { shopId, reason } = body;

    if (!shopId || !reason) {
      return NextResponse.json(
        { success: false, message: 'Shop ID and reason are required' },
        { status: 400 }
      );
    }

    // Check if report exists
    const report = await prisma.shop_reports.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Report has already been processed' },
        { status: 400 }
      );
    }

    // Verify shop ID matches the report
    if (report.shop_id !== shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID does not match the report' },
        { status: 400 }
      );
    }

    // Check if shop exists
    const shop = await prisma.users.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        is_active: true,
        full_name: true,
        business_name: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'Shop not found' },
        { status: 404 }
      );
    }

    // Use a transaction to update both shop and report
    await prisma.$transaction([
      // Suspend the shop (set is_active to false)
      prisma.users.update({
        where: { id: shopId },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      }),
      // Update report status to resolved
      prisma.shop_reports.update({
        where: { id: reportId },
        data: {
          status: 'resolved',
          admin_notes: `Shop suspended: ${reason}`,
          updated_at: new Date(),
        },
      }),
    ]);

    console.log(`✅ Shop ${shopId} (${shop.business_name || shop.full_name}) suspended due to report ${reportId}. Reason: ${reason}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Shop suspended successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Suspend shop error:', error);

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
        message: 'Failed to suspend shop',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
