import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/editor/activity-logs
 * Mirrors editor.routes.ts for dashboard activity
 */
export async function GET(request: NextRequest) {
  try {
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const adminId = searchParams.get('admin_id') || searchParams.get('adminId');
    const offset = (page - 1) * limit;

    const where: any = {};
    if (adminId) {
      where.admin_id = parseInt(adminId, 10);
    }

    const [logs, total] = await Promise.all([
      prisma.admin_activity_logs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.admin_activity_logs.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        action_type: log.action_type,
        target_type: log.target_type,
        target_id: log.target_id,
        details: log.details,
        admin_id: log.admin_id,
        admin_name: log.users?.full_name || 'System',
        admin_email: log.users?.email || '',
        created_at: log.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Activity logs API error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch activity logs' },
      { status: error?.message === 'Unauthorized' ? 401 : error?.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
