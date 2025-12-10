import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/jwt';

/**
 * Temporary placeholder for security audit API.
 * Returns empty data so the UI does not break.
 */
export async function GET(request: NextRequest) {
  try {
    await requireEditor(request);

    return NextResponse.json({
      success: true,
      data: {
        securityOverview: {
          failedLogins: { last_24h: 0, unique_users: 0 },
          successfulLogins: 0,
          twoFactorAuth: { enabled: 0, total: 0 },
          suspensions: { last_24h: 0 },
        },
        activityLogs: [],
        sessions: [],
        events: [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Security audit not available' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
