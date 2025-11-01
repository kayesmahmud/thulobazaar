import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/users
 * Get users list for editor dashboard (with filters)
 * Requires: Editor or Super Admin role
 *
 * Query params:
 * - role: 'user' | 'editor' | 'super_admin' (optional, defaults to exclude editor/super_admin)
 * - status: 'active' | 'suspended' (optional)
 * - search: string (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - sortBy: 'created_at' | 'full_name' | 'email' (default: 'created_at')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Exclude editor and super_admin roles by default
    if (!role) {
      where.role = { notIn: ['editor', 'super_admin'] };
    } else {
      where.role = role;
    }

    // Filter by active/suspended status
    if (status === 'active') {
      where.is_active = true;
      where.is_suspended = false;
    } else if (status === 'suspended') {
      where.is_suspended = true;
    }

    // Search
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.users.count({ where });

    // Fetch users with relations
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        is_verified: true,
        is_suspended: true,
        suspended_until: true,
        suspension_reason: true,
        suspended_by: true,
        created_at: true,
        avatar: true,
        location_id: true,
        locations: {
          select: {
            name: true,
          },
        },
        users_users_suspended_byTousers: {
          select: {
            full_name: true,
          },
        },
        ads_ads_user_idTousers: {
          where: { deleted_at: null },
          select: { id: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedUsers = users.map((user) => ({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      isSuspended: user.is_suspended,
      suspendedUntil: user.suspended_until,
      suspensionReason: user.suspension_reason,
      createdAt: user.created_at,
      avatar: user.avatar,
      locationName: user.locations?.name || null,
      suspendedByName: user.users_users_suspended_byTousers?.full_name || null,
      totalAds: user.ads_ads_user_idTousers.length,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedUsers,
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
    console.error('Admin users fetch error:', error);

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
        message: 'Failed to fetch users',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
