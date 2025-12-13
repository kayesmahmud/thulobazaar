/**
 * Notification Service
 * Handles sending notifications via Email and SMS
 */

import { sendNotificationSms, NotificationType, validateNepaliPhone } from '../sms/aakashSms';
import nodemailer from 'nodemailer';
import { prisma } from '@thulobazaar/database';

interface NotificationResult {
  success: boolean;
  email?: { success: boolean; error?: string };
  sms?: { success: boolean; error?: string };
}

interface UserNotificationData {
  userId: number;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
}

/**
 * Get email template based on notification type
 */
function getEmailTemplate(
  type: NotificationType,
  details?: { reason?: string; userName?: string }
): { subject: string; html: string; text: string } {
  const name = details?.userName || 'User';

  const templates: Record<NotificationType, { subject: string; html: string; text: string }> = {
    business_verification_approved: {
      subject: 'Business Verification Approved - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Congratulations, ${name}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your business verification has been <strong style="color: #059669;">approved</strong>!
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You can now enjoy all the benefits of being a verified business seller on Thulo Bazaar:
            </p>
            <ul style="color: #4b5563; font-size: 14px; line-height: 1.8;">
              <li>Business verified badge on your profile</li>
              <li>Priority listing for your ads</li>
              <li>Access to business analytics</li>
              <li>Enhanced trust with buyers</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thulobazaar.com'}/dashboard"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Go to Dashboard
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This email was sent by Thulo Bazaar. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      text: `Congratulations ${name}! Your business verification has been approved on Thulo Bazaar. You can now enjoy all business seller benefits.`,
    },
    business_verification_rejected: {
      subject: 'Business Verification Update - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Dear ${name},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              We regret to inform you that your business verification request could not be approved at this time.
            </p>
            ${details?.reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <strong style="color: #dc2626;">Reason:</strong>
                <p style="color: #7f1d1d; margin: 5px 0 0 0;">${details.reason}</p>
              </div>
            ` : ''}
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You can submit a new verification request with the correct documents.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thulobazaar.com'}/verification"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Submit New Request
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>If you have questions, please contact our support team.</p>
          </div>
        </div>
      `,
      text: `Dear ${name}, your business verification request on Thulo Bazaar was not approved. ${details?.reason ? `Reason: ${details.reason}` : ''} You can submit a new request with correct documents.`,
    },
    individual_verification_approved: {
      subject: 'Identity Verification Approved - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Congratulations, ${name}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your identity verification has been <strong style="color: #059669;">approved</strong>!
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your profile now displays the verified badge, increasing trust with potential buyers.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thulobazaar.com'}/profile"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View Profile
            </a>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This email was sent by Thulo Bazaar.</p>
          </div>
        </div>
      `,
      text: `Congratulations ${name}! Your identity verification has been approved on Thulo Bazaar.`,
    },
    individual_verification_rejected: {
      subject: 'Identity Verification Update - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Dear ${name},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your identity verification request could not be approved.
            </p>
            ${details?.reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <strong style="color: #dc2626;">Reason:</strong>
                <p style="color: #7f1d1d; margin: 5px 0 0 0;">${details.reason}</p>
              </div>
            ` : ''}
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Please ensure your ID documents are clear and submit a new request.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thulobazaar.com'}/verification"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Submit New Request
            </a>
          </div>
        </div>
      `,
      text: `Dear ${name}, your identity verification request was not approved. ${details?.reason ? `Reason: ${details.reason}` : ''}`,
    },
    account_suspended: {
      subject: 'Account Suspended - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Dear ${name},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your Thulo Bazaar account has been <strong style="color: #dc2626;">suspended</strong>.
            </p>
            ${details?.reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <strong style="color: #dc2626;">Reason:</strong>
                <p style="color: #7f1d1d; margin: 5px 0 0 0;">${details.reason}</p>
              </div>
            ` : ''}
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              If you believe this is a mistake, please contact our support team.
            </p>
          </div>
        </div>
      `,
      text: `Dear ${name}, your Thulo Bazaar account has been suspended. ${details?.reason ? `Reason: ${details.reason}` : ''}`,
    },
    account_unsuspended: {
      subject: 'Account Restored - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Good News, ${name}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your Thulo Bazaar account has been <strong style="color: #059669;">restored</strong>!
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You can now access all features again. Thank you for your patience.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thulobazaar.com'}"
               style="display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Go to Thulo Bazaar
            </a>
          </div>
        </div>
      `,
      text: `Good news ${name}! Your Thulo Bazaar account has been restored.`,
    },
    ad_approved: {
      subject: 'Your Ad is Now Live - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Great News, ${name}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your ad has been <strong style="color: #059669;">approved</strong> and is now live on Thulo Bazaar!
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://thulobazaar.com'}/my-ads"
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View My Ads
            </a>
          </div>
        </div>
      `,
      text: `Great news ${name}! Your ad on Thulo Bazaar has been approved and is now live.`,
    },
    ad_rejected: {
      subject: 'Ad Not Approved - Thulo Bazaar',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thulo Bazaar</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Dear ${name},</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Unfortunately, your ad could not be approved.
            </p>
            ${details?.reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <strong style="color: #dc2626;">Reason:</strong>
                <p style="color: #7f1d1d; margin: 5px 0 0 0;">${details.reason}</p>
              </div>
            ` : ''}
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Please review your ad and make necessary changes before resubmitting.
            </p>
          </div>
        </div>
      `,
      text: `Dear ${name}, your ad on Thulo Bazaar was not approved. ${details?.reason ? `Reason: ${details.reason}` : ''}`,
    },
  };

  return templates[type] || {
    subject: 'Notification from Thulo Bazaar',
    html: `<p>You have a notification from Thulo Bazaar.</p>`,
    text: 'You have a notification from Thulo Bazaar.',
  };
}

/**
 * Get SMTP settings from database or env
 */
async function getSmtpSettings() {
  try {
    const settings = await prisma.site_settings.findMany({
      where: {
        setting_key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_email', 'smtp_from_name', 'smtp_enabled'],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));

    // Check if SMTP is enabled
    const smtpEnabled = settingsMap.get('smtp_enabled');
    if (smtpEnabled === 'false') {
      return null;
    }

    // Fall back to env vars if not in database
    return {
      host: settingsMap.get('smtp_host') || process.env.SMTP_HOST,
      port: parseInt(settingsMap.get('smtp_port') || process.env.SMTP_PORT || '587'),
      user: settingsMap.get('smtp_user') || process.env.SMTP_USER,
      pass: settingsMap.get('smtp_pass') || process.env.SMTP_PASS,
      fromEmail: settingsMap.get('smtp_from_email') || process.env.SMTP_FROM_EMAIL || 'noreply@thulobazaar.com',
      fromName: settingsMap.get('smtp_from_name') || process.env.SMTP_FROM_NAME || 'Thulo Bazaar',
    };
  } catch (error) {
    console.error('Error getting SMTP settings:', error);
    // Fall back to env vars
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@thulobazaar.com',
      fromName: process.env.SMTP_FROM_NAME || 'Thulo Bazaar',
    };
  }
}

/**
 * Check if SMS notifications are enabled
 */
async function isSmsEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.site_settings.findUnique({
      where: { setting_key: 'sms_enabled' },
    });
    if (setting?.setting_value === 'false') {
      return false;
    }
    // Default to true if AAKASH_SMS_TOKEN is set
    return !!process.env.AAKASH_SMS_TOKEN;
  } catch {
    return !!process.env.AAKASH_SMS_TOKEN;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  email: string,
  type: NotificationType,
  details?: { reason?: string; userName?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpSettings = await getSmtpSettings();

    if (!smtpSettings || !smtpSettings.host || !smtpSettings.user) {
      console.log('SMTP not configured, skipping email notification');
      return { success: false, error: 'SMTP not configured' };
    }

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.port === 465,
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass,
      },
    });

    const template = getEmailTemplate(type, details);

    await transporter.sendMail({
      from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`✅ Email notification sent to ${email} (${type})`);
    return { success: true };
  } catch (error) {
    console.error('Email notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send notification to user via all available channels (Email + SMS)
 */
export async function sendUserNotification(
  user: UserNotificationData,
  type: NotificationType,
  details?: { reason?: string }
): Promise<NotificationResult> {
  const result: NotificationResult = { success: false };
  const userName = user.fullName || undefined;

  // Send Email if available
  if (user.email) {
    result.email = await sendEmailNotification(user.email, type, { ...details, userName });
  }

  // Send SMS if phone is valid Nepali number and SMS is enabled
  if (user.phone) {
    const smsEnabled = await isSmsEnabled();
    if (smsEnabled && validateNepaliPhone(user.phone)) {
      const smsResult = await sendNotificationSms(user.phone, type, { ...details, userName });
      result.sms = { success: smsResult.success, error: smsResult.error };
    }
  }

  // Consider success if at least one channel succeeded
  result.success = result.email?.success || result.sms?.success || false;

  return result;
}

/**
 * Send notification by user ID
 */
export async function sendNotificationByUserId(
  userId: number,
  type: NotificationType,
  details?: { reason?: string }
): Promise<NotificationResult> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        full_name: true,
      },
    });

    if (!user) {
      console.error(`User ${userId} not found for notification`);
      return { success: false };
    }

    return sendUserNotification(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
      },
      type,
      details
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false };
  }
}
