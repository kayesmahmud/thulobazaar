/**
 * AakashSMS Service for sending OTP via SMS in Nepal
 * API Documentation: https://aakashsms.com/documentation/
 */

import { prisma } from '@thulobazaar/database';

const AAKASH_SMS_API_URL = 'https://sms.aakashsms.com/sms/v3/send';

interface SendSmsResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Validate Nepali phone number format
 * Valid formats: 98XXXXXXXX, 97XXXXXXXX (10 digits starting with 97 or 98)
 */
export function validateNepaliPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return /^(97|98)\d{8}$/.test(cleanPhone);
}

/**
 * Format phone number to standard 10-digit format
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  // Remove +977 prefix if present
  if (cleanPhone.startsWith('977')) {
    return cleanPhone.slice(3);
  }
  return cleanPhone;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export type OtpPurpose = 'registration' | 'login' | 'password_reset' | 'phone_verification';

export type NotificationType =
  | 'business_verification_approved'
  | 'business_verification_rejected'
  | 'individual_verification_approved'
  | 'individual_verification_rejected'
  | 'account_suspended'
  | 'account_unsuspended'
  | 'ad_approved'
  | 'ad_rejected';

/**
 * Get SMS message based on purpose
 */
function getOtpMessage(otp: string, purpose: OtpPurpose): string {
  switch (purpose) {
    case 'registration':
      return `Welcome to Thulo Bazaar! Your signup verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    case 'password_reset':
      return `Your Thulo Bazaar password reset code is: ${otp}. Valid for 10 minutes. If you didn't request this, please ignore.`;
    case 'phone_verification':
      return `Your Thulo Bazaar phone verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    default:
      return `Your Thulo Bazaar verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  }
}

// Map notification type to database setting key
const notificationTypeToSettingKey: Record<NotificationType, string> = {
  business_verification_approved: 'sms_business_approved',
  business_verification_rejected: 'sms_business_rejected',
  individual_verification_approved: 'sms_individual_approved',
  individual_verification_rejected: 'sms_individual_rejected',
  account_suspended: 'sms_account_suspended',
  account_unsuspended: 'sms_account_unsuspended',
  ad_approved: 'sms_ad_approved',
  ad_rejected: 'sms_ad_rejected',
};

// Default messages (fallback if no custom template in database)
// These MUST match the defaults in settings/page.tsx for UI consistency
const defaultMessages: Record<NotificationType, string> = {
  business_verification_approved: 'Congratulations {name}! Your business verification on Thulo Bazaar has been approved. You can now enjoy all business seller benefits.',
  business_verification_rejected: 'Dear {name}, your business verification on Thulo Bazaar was not approved. Reason: {reason}. Please submit a new request with correct documents.',
  individual_verification_approved: 'Congratulations {name}! Your identity verification on Thulo Bazaar has been approved.',
  individual_verification_rejected: 'Dear {name}, your identity verification on Thulo Bazaar was not approved. Reason: {reason}.',
  account_suspended: 'Dear {name}, your Thulo Bazaar account has been suspended. Reason: {reason}. Contact support for assistance.',
  account_unsuspended: 'Good news {name}! Your Thulo Bazaar account has been restored. You can now access all features.',
  ad_approved: 'Great news {name}! Your ad on Thulo Bazaar has been approved and is now live.',
  ad_rejected: 'Dear {name}, your ad on Thulo Bazaar was not approved. Reason: {reason}.',
};

/**
 * Get notification message based on type (fetches custom template from DB if available)
 */
async function getNotificationMessage(type: NotificationType, details?: { reason?: string; userName?: string }): Promise<string> {
  const name = details?.userName || 'User';
  const reason = details?.reason || 'Not specified';

  // Try to get custom template from database
  let template = defaultMessages[type];
  try {
    const settingKey = notificationTypeToSettingKey[type];
    const setting = await prisma.site_settings.findUnique({
      where: { setting_key: settingKey },
    });
    if (setting?.setting_value) {
      template = setting.setting_value;
    }
  } catch (err) {
    console.error('Error fetching SMS template from DB:', err);
  }

  // Replace placeholders
  return template
    .replace(/\{name\}/g, name)
    .replace(/\{reason\}/g, reason);
}

/**
 * Send OTP SMS via AakashSMS API
 */
export async function sendOtpSms(
  phone: string,
  otp: string,
  purpose: OtpPurpose = 'registration'
): Promise<SendSmsResponse> {
  const authToken = process.env.AAKASH_SMS_TOKEN;

  // In non-production, allow OTP flow to continue even if token is missing, so local/dev can verify
  if (!authToken) {
    const msg = `AAKASH_SMS_TOKEN not configured. Mocking OTP send for ${phone}: ${otp}`;
    if (process.env.NODE_ENV !== 'production') {
      console.warn(msg);
      return {
        success: true,
        message: 'SMS mocked (token not configured in non-production)',
      };
    }
    console.error(msg);
    return {
      success: false,
      message: 'SMS service not configured',
      error: 'AAKASH_SMS_TOKEN environment variable is not set',
    };
  }

  const formattedPhone = formatPhoneNumber(phone);

  if (!validateNepaliPhone(formattedPhone)) {
    return {
      success: false,
      message: 'Invalid Nepali phone number',
      error: 'Phone number must be 10 digits starting with 97 or 98',
    };
  }

  const message = getOtpMessage(otp, purpose);

  try {
    const response = await fetch(AAKASH_SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        to: formattedPhone,
        text: message,
      }),
    });

    const data = await response.json();

    // AakashSMS returns { error: false, message: "...", data: {...} } on success
    if (response.ok && data.error === false) {
      console.log(`✅ OTP sent successfully to ${formattedPhone}`);
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } else {
      console.error('AakashSMS API error:', data);
      return {
        success: false,
        message: 'Failed to send OTP',
        error: data.message || data.response || 'Unknown error from SMS provider',
      };
    }
  } catch (error) {
    console.error('AakashSMS request failed:', error);
    return {
      success: false,
      message: 'Failed to send OTP',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Calculate OTP expiry time (10 minutes from now)
 */
export function getOtpExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

/**
 * Send notification SMS via AakashSMS API
 */
export async function sendNotificationSms(
  phone: string,
  type: NotificationType,
  details?: { reason?: string; userName?: string }
): Promise<SendSmsResponse> {
  const authToken = process.env.AAKASH_SMS_TOKEN;

  if (!authToken) {
    console.error('AAKASH_SMS_TOKEN not configured');
    return {
      success: false,
      message: 'SMS service not configured',
      error: 'AAKASH_SMS_TOKEN environment variable is not set',
    };
  }

  const formattedPhone = formatPhoneNumber(phone);

  if (!validateNepaliPhone(formattedPhone)) {
    return {
      success: false,
      message: 'Invalid Nepali phone number',
      error: 'Phone number must be 10 digits starting with 97 or 98',
    };
  }

  const message = await getNotificationMessage(type, details);

  try {
    const response = await fetch(AAKASH_SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        to: formattedPhone,
        text: message,
      }),
    });

    const data = await response.json();

    if (response.ok && data.error === false) {
      console.log(`✅ Notification SMS sent successfully to ${formattedPhone} (${type})`);
      return {
        success: true,
        message: 'Notification sent successfully',
      };
    } else {
      console.error('AakashSMS API error:', data);
      return {
        success: false,
        message: 'Failed to send notification',
        error: data.message || data.response || 'Unknown error from SMS provider',
      };
    }
  } catch (error) {
    console.error('AakashSMS notification request failed:', error);
    return {
      success: false,
      message: 'Failed to send notification',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
