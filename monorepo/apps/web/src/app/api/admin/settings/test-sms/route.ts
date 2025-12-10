import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/jwt';
import { sendNotificationSms } from '@/lib/aakashSms';

/**
 * POST /api/admin/settings/test-sms
 * Send a test SMS to verify Aakash SMS configuration
 * Requires: Super Admin role
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      );
    }

    const result = await sendNotificationSms(
      phone,
      'individual_verification_approved',
      { userName: 'Test User' }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to send SMS' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Test SMS error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send test SMS' },
      { status: 500 }
    );
  }
}
