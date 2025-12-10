import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/jwt';
import nodemailer from 'nodemailer';

/**
 * POST /api/admin/settings/test-email
 * Send a test email to verify SMTP configuration
 * Requires: Super Admin role
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { email, settings } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
      return NextResponse.json(
        { success: false, message: 'SMTP settings are incomplete' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${settings.smtpFromName || 'Thulo Bazaar'}" <${settings.smtpFromEmail || settings.smtpUser}>`,
      to: email,
      subject: 'Test Email - Thulo Bazaar',
      text: 'This is a test email from Thulo Bazaar. If you received this, your SMTP configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Test Email</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              This is a test email from Thulo Bazaar.
            </p>
            <p style="color: #059669; font-size: 16px; font-weight: bold;">
              If you received this, your SMTP configuration is working correctly!
            </p>
            <div style="margin-top: 20px; padding: 15px; background: #e0e7ff; border-radius: 8px;">
              <p style="color: #3730a3; margin: 0; font-size: 14px;">
                <strong>SMTP Host:</strong> ${settings.smtpHost}<br>
                <strong>SMTP Port:</strong> ${settings.smtpPort}<br>
                <strong>From:</strong> ${settings.smtpFromEmail}
              </p>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This is an automated test email from Thulo Bazaar Admin Panel.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error: any) {
    console.error('Test email error:', error);

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

    // Common SMTP errors
    let errorMessage = 'Failed to send test email';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Could not connect to SMTP server. Check host and port.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check username and password.';
    } else if (error.responseCode === 535) {
      errorMessage = 'Invalid credentials. For Gmail, use an App Password.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
