import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/editor/reported-shops/[id]/dismiss
 * Dismiss a shop report (mark as false/invalid)
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - reason: string (optional) - Admin notes for dismissal
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
    const { reason } = body;

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

    // Update report status to dismissed
    await prisma.shop_reports.update({
      where: { id: reportId },
      data: {
        status: 'dismissed',
        admin_notes: reason || 'Report verified as false/invalid',
        updated_at: new Date(),
      },
    });

    console.log(`✅ Shop report ${reportId} dismissed with reason: ${reason || 'N/A'}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Report dismissed successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dismiss shop report error:', error);

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
        message: 'Failed to dismiss report',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
