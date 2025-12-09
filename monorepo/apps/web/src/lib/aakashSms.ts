/**
 * AakashSMS Service for sending OTP via SMS in Nepal
 * API Documentation: https://aakashsms.com/documentation/
 */

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

/**
 * Send OTP SMS via AakashSMS API
 */
export async function sendOtpSms(
  phone: string,
  otp: string,
  purpose: OtpPurpose = 'registration'
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
