import { NextRequest, NextResponse } from 'next/server';
import { cleanupDeletedAccounts } from '@/lib/users/cleanupDeletedAccounts';

/**
 * GET /api/cron/cleanup-deleted-accounts
 *
 * Cron job endpoint to permanently delete accounts past the 30-day recovery period.
 *
 * This endpoint should be called daily by an external cron service.
 * It is protected by a CRON_SECRET environment variable.
 *
 * Example cron configuration (Vercel):
 * In vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-deleted-accounts",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * Or use external service like:
 * - Railway cron
 * - Upstash QStash
 * - cron-job.org
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Starting cleanup of deleted accounts...');

    const result = await cleanupDeletedAccounts();

    console.log('[Cron] Cleanup completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('[Cron] Cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that use POST
export async function POST(request: NextRequest) {
  return GET(request);
}
