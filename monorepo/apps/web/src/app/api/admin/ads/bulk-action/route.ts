import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * POST /api/admin/ads/bulk-action
 * Perform bulk actions on multiple ads
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - action: 'approve' | 'reject' | 'delete' | 'restore' (required)
 * - adIds: number[] (required)
 * - reason: string (optional, required for reject and delete)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const body = await request.json();
    const { action, adIds, reason } = body;

    // Validate required fields
    if (!action || !adIds || !Array.isArray(adIds) || adIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Action and adIds array are required',
        },
        { status: 400 }
      );
    }

    let result;
    let updateData: any = {};

    switch (action) {
      case 'approve':
        updateData = {
          status: 'approved',
          reviewed_by: editor.userId,
          reviewed_at: new Date(),
          updated_at: new Date(),
        };

        result = await prisma.ads.updateMany({
          where: {
            id: { in: adIds },
            deleted_at: null,
          },
          data: updateData,
        });

        console.log(`✅ ${result.count} ads approved by editor ${editor.userId}`);
        break;

      case 'reject':
        if (!reason) {
          return NextResponse.json(
            {
              success: false,
              message: 'Rejection reason is required',
            },
            { status: 400 }
          );
        }

        updateData = {
          status: 'rejected',
          reviewed_by: editor.userId,
          reviewed_at: new Date(),
          updated_at: new Date(),
        };

        result = await prisma.ads.updateMany({
          where: {
            id: { in: adIds },
            deleted_at: null,
          },
          data: updateData,
        });

        console.log(`❌ ${result.count} ads rejected by editor ${editor.userId}`);
        break;

      case 'delete':
        updateData = {
          deleted_at: new Date(),
          deleted_by: editor.userId,
          deletion_reason: reason || 'Bulk deletion',
          updated_at: new Date(),
        };

        result = await prisma.ads.updateMany({
          where: {
            id: { in: adIds },
            deleted_at: null,
          },
          data: updateData,
        });

        console.log(`🗑️ ${result.count} ads deleted by editor ${editor.userId}`);
        break;

      case 'restore':
        updateData = {
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
          updated_at: new Date(),
        };

        result = await prisma.ads.updateMany({
          where: {
            id: { in: adIds },
            deleted_at: { not: null },
          },
          data: updateData,
        });

        console.log(`♻️ ${result.count} ads restored by editor ${editor.userId}`);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid action. Must be: approve, reject, delete, or restore',
          },
          { status: 400 }
        );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${action} completed successfully`,
        data: {
          affected: result.count,
          requestedIds: adIds,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Bulk action error:', error);

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
        message: 'Failed to perform bulk action',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
