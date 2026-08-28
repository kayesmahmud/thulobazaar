/**
 * @thulobazaar/auth-core
 *
 * Single source of truth for OTP, phone verification and SMS, shared by the
 * Express API and the Next.js web app.
 */

// SMS + phone helpers
export {
  sendOtpSms,
  sendNotificationSms,
  validateNepaliPhone,
  formatPhoneNumber,
  generateOtp,
  getOtpExpiry,
  type OtpPurpose,
  type NotificationType,
} from './sms';

// Signed verification tokens
export {
  signVerificationToken,
  validateVerificationToken,
  type VerificationTokenPayload,
} from './token';

// OTP / phone-verification core
export {
  sendOtp,
  verifyOtp,
  updatePhone,
  canChangePhone,
  MAX_OTP_ATTEMPTS,
  OTP_COOLDOWN_SECONDS,
  MAX_VERIFY_ATTEMPTS,
  VERIFICATION_TOKEN_EXPIRY_MS,
  type SendOtpResult,
  type VerifyOtpResult,
  type UpdatePhoneResult,
  type SendOtpOptions,
} from './otp';
