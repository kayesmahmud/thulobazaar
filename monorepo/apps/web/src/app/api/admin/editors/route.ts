import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/editors
 * Get all editors and super admins
 * Requires: Editor or Super Admin role (typically Super Admin only)
 *
 * Returns list of all users with editor or super_admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor (in production, this should be requireAdmin)
    await requireEditor(request);

    // Fetch all editors with their activity stats
    const editors = await prisma.users.findMany({
      where: {
        role: { in: ['editor', 'super_admin'] },
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
        avatar: true,
        admin_activity_logs: {
          select: { id: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform to camelCase with activity count
    const transformedEditors = editors.map((editor) => ({
      id: editor.id,
      fullName: editor.full_name,
      email: editor.email,
      role: editor.role,
      isActive: editor.is_active,
      createdAt: editor.created_at,
      avatar: editor.avatar,
      totalActions: editor.admin_activity_logs.length,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedEditors,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Editors list fetch error:', error);

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
        message: 'Failed to fetch editors',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
