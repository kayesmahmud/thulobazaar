import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

/**
 * POST /api/editor/reported-shops/[id]/unsuspend
 * Restore a suspended shop (make it active again)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - shopId: number (required) - The user ID of the shop to unsuspend
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor and get their info
    const editor = await requireEditor(request);

    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { success: false, message: 'Shop ID is required' },
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

    if (shop.is_active) {
      return NextResponse.json(
        { success: false, message: 'Shop is already active' },
        { status: 400 }
      );
    }

    // Use a transaction to update shop, report, and log the action
    await prisma.$transaction([
      // Unsuspend the shop (set is_active to true)
      prisma.users.update({
        where: { id: shopId },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
      }),
      // Update report status to 'restored' and track who restored it
      prisma.shop_reports.update({
        where: { id: reportId },
        data: {
          status: 'restored',
          admin_notes: `${report.admin_notes || ''}\n[RESTORED] Shop unsuspended by editor.`.trim(),
          resolved_by: editor.userId,
          updated_at: new Date(),
        },
      }),
      // Log the action to admin_activity_logs
      prisma.admin_activity_logs.create({
        data: {
          admin_id: editor.userId,
          action_type: 'shop_restore',
          target_type: 'shop_report',
          target_id: reportId,
          details: {
            shopId,
            shopName: shop.business_name || shop.full_name,
            reportReason: report.reason,
          },
        },
      }),
    ]);

    console.log(`✅ Shop ${shopId} (${shop.business_name || shop.full_name}) restored by editor ${editor.userId} from report ${reportId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Shop restored successfully. The shop is now active.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Unsuspend shop error:', error);

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
        message: 'Failed to restore shop',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
