import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/activity-logs
 * Get admin activity logs with filters
 * Requires: Editor or Super Admin role
 *
 * Query params:
 * - adminId: number (optional)
 * - actionType: string (optional)
 * - targetType: string (optional)
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const actionType = searchParams.get('actionType');
    const targetType = searchParams.get('targetType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (adminId) {
      where.admin_id = parseInt(adminId);
    }

    if (actionType) {
      where.action_type = actionType;
    }

    if (targetType) {
      where.target_type = targetType;
    }

    // Get total count
    const total = await prisma.admin_activity_logs.count({ where });

    // Fetch logs with admin info
    const logs = await prisma.admin_activity_logs.findMany({
      where,
      select: {
        id: true,
        action_type: true,
        target_type: true,
        target_id: true,
        details: true,
        ip_address: true,
        created_at: true,
        admin_id: true,
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      actionType: log.action_type,
      targetType: log.target_type,
      targetId: log.target_id,
      details: log.details,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      adminName: log.users?.full_name || null,
      adminEmail: log.users?.email || null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin activity logs fetch error:', error);

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
        message: 'Failed to fetch activity logs',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
