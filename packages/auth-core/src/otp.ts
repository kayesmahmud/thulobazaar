/**
 * OTP + phone-verification core — the single source of truth shared by the
 * Express API and the Next.js web app. Both apps keep their own HTTP/auth
 * layer (JWT vs NextAuth) but call these functions for the actual logic, so
 * the two can no longer drift apart.
 */

import crypto from 'crypto';
import { prisma } from '@thulobazaar/database';
import {
  formatPhoneNumber,
  validateNepaliPhone,
  generateOtp,
  getOtpExpiry,
  sendOtpSms,
  type OtpPurpose,
} from './sms';
import { signVerificationToken, validateVerificationToken } from './token';

export const MAX_OTP_ATTEMPTS = 4; // OTP *requests* per hour
export const OTP_COOLDOWN_SECONDS = 60;
export const MAX_VERIFY_ATTEMPTS = 5; // wrong-code *guesses* per OTP
export const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const OTP_VALIDITY_SECONDS = 600; // 10 minutes

export interface SendOtpResult {
  success: boolean;
  error?: string;
  identifier?: string;
  expiresIn?: number;
  cooldownRemaining?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  identifier?: string;
  verificationToken?: string;
  remainingAttempts?: number;
}

export interface UpdatePhoneResult {
  success: boolean;
  error?: string;
  phone?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: Date | null;
}

export interface SendOtpOptions {
  /**
   * The id of the currently logged-in user, for the `phone_verification`
   * purpose. When provided, a user re-verifying their OWN already-verified
   * number is allowed through (we only reject numbers owned by someone else).
   */
  currentUserId?: number;
}

/**
 * Send an OTP for the given purpose. Performs all purpose-specific guards
 * (including the duplicate-phone check) BEFORE generating or texting a code,
 * so a number that's already in use never costs an SMS.
 */
// 🔒 AUTH-L2: constant-time comparison for OTP codes (avoid a timing side channel).
// OTP length is fixed (6 digits), so the length-mismatch early return leaks nothing.
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function sendOtp(
  phone: string,
  purpose: OtpPurpose,
  options: SendOtpOptions = {}
): Promise<SendOtpResult> {
  const formattedPhone = formatPhoneNumber(phone);

  if (!validateNepaliPhone(formattedPhone)) {
    return { success: false, error: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.' };
  }

  // Purpose-specific validations
  if (purpose === 'registration') {
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, phone_verified: true },
    });
    if (existingUser) {
      return { success: false, error: 'This phone number is already registered' };
    }
  }

  if (purpose === 'login') {
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, phone_verified: true, is_active: true },
    });
    if (!existingUser) {
      // 🔒 AUTH-M2: don't reveal whether an account exists. Return the same success
      // shape as a real send without generating/texting an OTP — a later verify just
      // fails, indistinguishable from a wrong code.
      return { success: true, identifier: formattedPhone, expiresIn: OTP_VALIDITY_SECONDS };
    }
    if (existingUser.is_suspended) {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
  }

  if (purpose === 'password_reset') {
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, is_active: true },
    });
    if (!existingUser) {
      // 🔒 AUTH-M2: success-shaped, no OTP sent (see login note above).
      return { success: true, identifier: formattedPhone, expiresIn: OTP_VALIDITY_SECONDS };
    }
    if (existingUser.is_suspended) {
      return { success: false, error: 'Your account has been suspended. Please contact support.' };
    }
  }

  // A logged-in user adding/changing their phone. Reject up-front if the number
  // is verified by ANOTHER account, instead of sending an OTP and only failing
  // later at updatePhone. currentUserId lets a user re-verify their own number.
  if (purpose === 'phone_verification') {
    const existingUser = await prisma.users.findFirst({
      where: {
        phone: formattedPhone,
        phone_verified: true,
        ...(options.currentUserId ? { id: { not: options.currentUserId } } : {}),
      },
    });
    if (existingUser) {
      return { success: false, error: 'This phone number is already in use. Please use another number.' };
    }
  }

  // Cooldown: one OTP per phone+purpose per OTP_COOLDOWN_SECONDS
  const recentOtp = await prisma.phone_otps.findFirst({
    where: {
      phone: formattedPhone,
      purpose,
      created_at: { gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { created_at: 'desc' },
  });

  if (recentOtp) {
    const secondsRemaining = Math.ceil(
      (OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.created_at.getTime())) / 1000
    );
    return {
      success: false,
      error: `Please wait ${secondsRemaining} seconds before requesting a new OTP`,
      cooldownRemaining: secondsRemaining,
    };
  }

  // Cap OTP requests per hour
  const recentAttempts = await prisma.phone_otps.count({
    where: {
      phone: formattedPhone,
      purpose,
      created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentAttempts >= MAX_OTP_ATTEMPTS) {
    return { success: false, error: 'Too many OTP requests. Please try again after 1 hour.' };
  }

  // Invalidate previous unused OTPs for this phone+purpose
  await prisma.phone_otps.updateMany({
    where: { phone: formattedPhone, purpose, is_used: false },
    data: { is_used: true },
  });

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.phone_otps.create({
    data: {
      phone: formattedPhone,
      otp_code: otp,
      purpose,
      expires_at: expiresAt,
    },
  });

  const smsResult = await sendOtpSms(formattedPhone, otp, purpose);

  if (!smsResult.success) {
    console.error('Failed to send OTP SMS:', smsResult.error);
    return { success: false, error: 'Failed to send OTP. Please try again.' };
  }

  console.log(`📱 OTP sent to ${formattedPhone} for ${purpose}`);

  return {
    success: true,
    identifier: formattedPhone,
    expiresIn: OTP_VALIDITY_SECONDS,
  };
}

/**
 * Verify an OTP code. On success returns a signed verification token the caller
 * passes to the next step (updatePhone / resetPassword). password_reset keeps
 * the OTP record un-consumed for that follow-up step.
 */
export async function verifyOtp(
  phone: string,
  otp: string,
  purpose: OtpPurpose
): Promise<VerifyOtpResult> {
  const formattedPhone = formatPhoneNumber(phone);

  const otpRecord = await prisma.phone_otps.findFirst({
    where: {
      phone: formattedPhone,
      purpose,
      is_used: false,
      expires_at: { gte: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otpRecord) {
    return { success: false, error: 'OTP expired or not found. Please request a new OTP.' };
  }

  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });
    return { success: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }

  if (!timingSafeEqualStr(otpRecord.otp_code, otp)) {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    const remainingAttempts = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;
    return {
      success: false,
      error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
      remainingAttempts,
    };
  }

  // password_reset needs the OTP record intact for the reset step
  if (purpose !== 'password_reset') {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });
  }

  console.log(`✅ OTP verified for ${formattedPhone} (${purpose})`);

  const verificationToken = signVerificationToken({
    identifier: formattedPhone,
    purpose,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + VERIFICATION_TOKEN_EXPIRY_MS,
  });

  return {
    success: true,
    identifier: formattedPhone,
    verificationToken,
  };
}

/**
 * Set + verify a logged-in user's phone after a successful phone_verification
 * OTP. Validates the signed token, re-checks the number isn't taken by another
 * account, then persists. The duplicate check excludes the user themselves.
 */
/**
 * Decides whether a signed-in user is allowed to move their account to a new
 * phone number.
 *
 * WHY THIS EXISTS: updatePhone() below currently accepts a verification token
 * proving control of the NEW number and nothing else. Because the phone number
 * is both the login identity and the password-reset channel, that means anyone
 * holding a live session can permanently take the account: they point it at
 * their own number and the original owner can no longer log in OR reset.
 *
 * THE TRADE-OFF (this is the decision, and it is a product decision, not a
 * technical one):
 *
 *   - Requiring the CURRENT PASSWORD locks out Google-only accounts, which have
 *     password_hash = null. They would have no way to change their number.
 *
 *   - Requiring an OTP TO THE OLD NUMBER locks out the single most common
 *     legitimate reason people change their number: they lost the SIM or
 *     switched carrier. In Nepal that is a large share of real requests.
 *
 *   - Accepting EITHER covers both populations, but a Google user who has lost
 *     their old SIM has neither proof and must go to support.
 *
 *   - Requiring BOTH is the strongest, and produces the most lockouts.
 *
 * Whatever this returns, updatePhone() must refuse to proceed on `false`, and
 * the old number should be SMS'd either way so a silent takeover is impossible.
 *
 * @param userId          the signed-in user attempting the change
 * @param currentPassword supplied by the client; undefined if not collected
 * @param oldNumberOtpToken a verification token for the user's EXISTING number;
 *                          undefined if not collected
 * @returns allowed: false plus a user-facing reason, or allowed: true
 */
export async function canChangePhone(
  userId: number,
  currentPassword?: string,
  oldNumberOtpToken?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // TODO(owner): implement the policy chosen above.
  //
  // The pieces you need are already in this file and in auth.service.ts:
  //   - prisma.users.findUnique({ where: { id: userId } })  -> .password_hash, .phone
  //   - bcrypt.compare(currentPassword, user.password_hash)
  //   - validateVerificationToken(token, phone, 'phone_verification')
  //
  // Fail CLOSED: if you cannot positively establish the user is entitled,
  // return { allowed: false, reason: ... }.
  throw new Error('canChangePhone: policy not yet implemented');
}

export async function updatePhone(
  userId: number,
  phone: string,
  verificationToken: string
): Promise<UpdatePhoneResult> {
  const formattedPhone = formatPhoneNumber(phone);

  if (!validateNepaliPhone(formattedPhone)) {
    return { success: false, error: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.' };
  }

  const tokenValidation = validateVerificationToken(verificationToken, formattedPhone, 'phone_verification');
  if (!tokenValidation.valid) {
    return { success: false, error: tokenValidation.error || 'Invalid verification' };
  }

  const existing = await prisma.users.findFirst({
    where: { phone: formattedPhone, phone_verified: true, id: { not: userId } },
  });
  if (existing) {
    return { success: false, error: 'This phone number is already in use. Please use another number.' };
  }

  const updated = await prisma.users.update({
    where: { id: userId },
    data: {
      phone: formattedPhone,
      phone_verified: true,
      phone_verified_at: new Date(),
      updated_at: new Date(),
    },
    select: {
      phone: true,
      phone_verified: true,
      phone_verified_at: true,
    },
  });

  // Consume any remaining OTPs for this number/purpose
  await prisma.phone_otps.updateMany({
    where: { phone: formattedPhone, purpose: 'phone_verification', is_used: false },
    data: { is_used: true },
  });

  return {
    success: true,
    phone: updated.phone ?? formattedPhone,
    phoneVerified: updated.phone_verified ?? true,
    phoneVerifiedAt: updated.phone_verified_at,
  };
}
