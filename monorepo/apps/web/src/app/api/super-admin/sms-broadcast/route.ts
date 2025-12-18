import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@thulobazaar/database';
import { validateNepaliPhone, formatPhoneNumber } from '@/lib/sms/aakashSms';

const AAKASH_SMS_API_URL = 'https://sms.aakashsms.com/sms/v3/send';

type RecipientType = 'all_users' | 'verified_individual' | 'verified_business';

interface BroadcastResult {
  success: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * GET /api/super-admin/sms-broadcast
 * Get recipient counts for preview
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Get counts for each recipient type
    const [allUsers, verifiedIndividual, verifiedBusiness] = await Promise.all([
      prisma.users.count({
        where: {
          phone: { not: null },
          is_active: true,
        },
      }),
      prisma.users.count({
        where: {
          phone: { not: null },
          is_active: true,
          individual_verified: true,
        },
      }),
      prisma.users.count({
        where: {
          phone: { not: null },
          is_active: true,
          business_verification_status: { in: ['approved', 'verified'] },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        all_users: allUsers,
        verified_individual: verifiedIndividual,
        verified_business: verifiedBusiness,
      },
    });
  } catch (error: any) {
    console.error('SMS broadcast count error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get recipient counts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/sms-broadcast
 * Send SMS broadcast to selected user group
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { message, recipientType } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    if (!recipientType || !['all_users', 'verified_individual', 'verified_business'].includes(recipientType)) {
      return NextResponse.json(
        { success: false, message: 'Valid recipient type is required' },
        { status: 400 }
      );
    }

    const authToken = process.env.AAKASH_SMS_TOKEN;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'SMS service not configured (AAKASH_SMS_TOKEN missing)' },
        { status: 500 }
      );
    }

    // Build where clause based on recipient type
    const whereClause: any = {
      phone: { not: null },
      is_active: true,
    };

    if (recipientType === 'verified_individual') {
      whereClause.individual_verified = true;
    } else if (recipientType === 'verified_business') {
      whereClause.business_verification_status = { in: ['approved', 'verified'] };
    }

    // Get recipients
    const recipients = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        phone: true,
        full_name: true,
      },
    });

    const result: BroadcastResult = {
      success: true,
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    // Send SMS to each recipient
    for (const recipient of recipients) {
      if (!recipient.phone) {
        result.skippedCount++;
        continue;
      }

      const formattedPhone = formatPhoneNumber(recipient.phone);

      if (!validateNepaliPhone(formattedPhone)) {
        result.skippedCount++;
        continue;
      }

      // Personalize message with user's name
      const personalizedMessage = message.replace(
        /\{name\}/gi,
        recipient.full_name || 'User'
      );

      try {
        const response = await fetch(AAKASH_SMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_token: authToken,
            to: formattedPhone,
            text: personalizedMessage,
          }),
        });

        const data = await response.json();

        if (response.ok && data.error === false) {
          result.sentCount++;
        } else {
          result.failedCount++;
          if (result.errors.length < 5) {
            result.errors.push(`Failed for ${formattedPhone}: ${data.message || 'Unknown error'}`);
          }
        }
      } catch (error: any) {
        result.failedCount++;
        if (result.errors.length < 5) {
          result.errors.push(`Error for ${formattedPhone}: ${error.message}`);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`📱 SMS Broadcast complete:`, result);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Sent ${result.sentCount} SMS, ${result.failedCount} failed, ${result.skippedCount} skipped`,
    });
  } catch (error: any) {
    console.error('SMS broadcast error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}
