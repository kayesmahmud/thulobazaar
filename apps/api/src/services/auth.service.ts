/**
 * Auth Service
 * Handles authentication, OTP, and user registration
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma, Prisma } from '@thulobazaar/database';
import { sendNotification } from './notification.service.js';
import {
  validateNepaliPhone,
  formatPhoneNumber,
  generateOtp,
  sendOtpSms,
  getOtpExpiry,
  validateVerificationToken,
  MAX_VERIFY_ATTEMPTS,
  type OtpPurpose,
} from '@thulobazaar/auth-core';

// OTP, phone-verification and verification-token logic now live in the shared
// @thulobazaar/auth-core package (single source of truth with the web app).
// Re-exported here so the API's routes keep importing them from the auth
// service unchanged.
export { sendOtp, verifyOtp, updatePhone } from '@thulobazaar/auth-core';
import { generateAccessToken, generateRefreshToken } from '../lib/token.js';
import { getBooleanSetting } from './adLimits.service.js';
import { generateShopSlug } from '../utils/shopSlug.js';
import { OAuth2Client } from 'google-auth-library';

// 🔒 AUTH-L2: constant-time OTP comparison (avoid a timing side channel). Guards
// non-string input; a length mismatch returns false without leaking anything useful.
function timingSafeEqualStr(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
import appleSignin from 'apple-signin-auth';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { SECURITY } from '../config/constants.js'; // 🔒 AUTH-L1: bcrypt cost = 12

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================================================
// Constants
// ============================================================================

// MAX_VERIFY_ATTEMPTS is imported from @thulobazaar/auth-core (used by the
// account-deletion OTP flow below); OTP request/cooldown/token constants now
// live in that package alongside the logic that uses them.
const RECOVERY_DAYS = 30;

// ============================================================================
// Types
// ============================================================================

export type OtpPurposeType = 'registration' | 'login' | 'password_reset' | 'phone_verification' | 'account_deletion';

export interface LoginResult {
  success: boolean;
  error?: string;
  token?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  tempToken?: string;
  accountPendingDeletion?: boolean;
  deletionDate?: string;
  /**
   * True only when this call created the account (OAuth paths register on
   * first login). Clients gate their sign_up conversion on this so returning
   * users are not counted as new registrations.
   */
  isNewUser?: boolean;
  user?: {
    id: number;
    email: string | null;
    fullName: string | null;
    phone: string | null;
    phoneVerified: boolean | null;
    role: string | null;
    shopSlug: string | null;
    accountType: string | null;
    avatar: string | null;
  };
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    fullName: string | null;
    phone: string | null;
    phoneVerified: boolean | null;
    role: string | null;
  };
}

// ============================================================================
// Login Functions
// ============================================================================

export async function loginWithPhone(phone: string, password: string): Promise<LoginResult> {
  const formattedPhone = formatPhoneNumber(phone);

  if (!validateNepaliPhone(formattedPhone)) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Find user
  const user = await prisma.users.findFirst({
    where: { phone: formattedPhone, phone_verified: true },
  });

  if (!user) {
    return { success: false, error: 'No account found with this phone number' };
  }

  if (user.is_suspended) {
    return { success: false, error: 'Your account has been suspended. Please contact support.' };
  }

  // Account deletion recovery: allow login within 30-day recovery window
  if (user.deleted_at && user.deletion_requested_at) {
    const daysSinceDeletion = (Date.now() - user.deletion_requested_at.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDeletion >= RECOVERY_DAYS) {
      return { success: false, error: 'This account has been permanently deleted.' };
    }
    // Will reactivate after password verification below
  } else if (!user.is_active) {
    return { success: false, error: 'Your account has been deactivated. Please contact support.' };
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash!);
  if (!isPasswordValid) {
    return { success: false, error: 'Invalid password' };
  }

  // Track if account is pending deletion (don't reactivate yet — let client decide)
  const isPendingDeletion = !!(user.deleted_at && user.deletion_requested_at);

  // Check if 2FA is enabled
  if (user.two_factor_enabled && user.two_factor_secret) {
    const tempToken = jwt.sign(
      { userId: user.id, purpose: '2fa' },
      config.JWT_SECRET,
      { expiresIn: '5m' }
    );
    return { success: true, requires2FA: true, tempToken };
  }

  // Update last login
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  console.log(`📱 Phone login successful for ${formattedPhone} (userId: ${user.id})${isPendingDeletion ? ' [pending deletion]' : ''}`);

  return {
    success: true,
    token: accessToken,
    refreshToken,
    ...(isPendingDeletion && {
      accountPendingDeletion: true,
      deletionDate: user.deletion_requested_at!.toISOString(),
    }),
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      role: user.role,
      shopSlug: user.shop_slug,
      accountType: user.account_type,
      avatar: user.avatar,
    },
  };
}

// ============================================================================
// Registration Functions
// ============================================================================

export async function registerWithPhone(
  phone: string,
  password: string,
  fullName: string,
  verificationToken: string
): Promise<RegisterResult> {
  const formattedPhone = formatPhoneNumber(phone);

  // Validate verification token
  const tokenValidation = validateVerificationToken(verificationToken, formattedPhone, 'registration');
  if (!tokenValidation.valid) {
    return {
      success: false,
      error: 'Invalid or expired verification token. Please verify your phone again.',
    };
  }

  // Check if already registered
  const existingUser = await prisma.users.findFirst({
    where: { phone: formattedPhone, phone_verified: true },
  });

  if (existingUser) {
    return { success: false, error: 'This phone number is already registered' };
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);

  let user = await prisma.users.create({
    data: {
      phone: formattedPhone,
      phone_verified: true,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'user',
      is_active: true,
    },
  });

  // Auto-generate shop_slug from name + user ID
  user = await prisma.users.update({
    where: { id: user.id },
    data: { shop_slug: generateShopSlug(fullName, user.id) },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  console.log(`📱 New user registered via phone: ${formattedPhone} (userId: ${user.id})`);

  // Send welcome notification (fire-and-forget)
  sendNotification({
    recipientUserIds: [user.id],
    type: 'welcome',
    title: 'Welcome to Thulo Bazaar!',
    body: 'Start browsing or post your first ad today. Happy selling!',
    data: { route: '/post-ad' },
  }).catch(err => console.error('Welcome notification error:', err));

  return {
    success: true,
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      role: user.role,
    },
  };
}

// ============================================================================
// Password Reset Functions
// ============================================================================

export async function resetPassword(
  phone: string,
  newPassword: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone);

  // Validate verification token
  const tokenValidation = validateVerificationToken(verificationToken, formattedPhone, 'password_reset');
  if (!tokenValidation.valid) {
    return {
      success: false,
      error: 'Invalid or expired verification token. Please verify your phone again.',
    };
  }

  // Find user
  const user = await prisma.users.findFirst({
    where: { phone: formattedPhone },
  });

  if (!user) {
    return { success: false, error: 'No account found with this phone number' };
  }

  // Mark OTP as used
  await prisma.phone_otps.updateMany({
    where: { phone: formattedPhone, purpose: 'password_reset', is_used: false },
    data: { is_used: true },
  });

  // Update password
  const passwordHash = await bcrypt.hash(newPassword, SECURITY.BCRYPT_SALT_ROUNDS);
  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash: passwordHash },
  });

  console.log(`🔐 Password reset successful for ${formattedPhone}`);

  return { success: true };
}

// ============================================================================
// Google Auth Functions
// ============================================================================

export async function verifyGoogleToken(idToken: string): Promise<LoginResult> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return { success: false, error: 'Invalid Google Token payload' };
    }

    const { email, name, picture, sub: googleId } = payload;

    // Find user by email or googleId
    let user = await prisma.users.findFirst({
      where: {
        OR: [{ email }, { oauth_provider_id: googleId }],
      },
    });

    // Whether this call registered someone rather than logging them back in.
    // Clients report sign_up conversions off this flag — counting returning
    // users as signups would inflate the metric ad platforms bid against.
    let isNewUser = false;

    if (!user) {
      // Check if registration is enabled before creating new user
      const registrationAllowed = await getBooleanSetting('allow_registration', true);
      if (!registrationAllowed) {
        return { success: false, error: 'New user registration is currently disabled' };
      }
      isNewUser = true;

      // Create new user
      user = await prisma.users.create({
        data: {
          email,
          full_name: name || 'User',
          avatar: picture,
          oauth_provider: 'google',
          oauth_provider_id: googleId,
          email_verified: payload.email_verified,
          role: 'user',
          is_active: true,
          // Since we don't have a phone number yet, we leave it null.
          // Password hash is required by schema but nullable in some setups?
          // Let's check schema. Schema says password_hash String @db.VarChar(255) (Not optional?)
          // Wait, viewing schema again...
          password_hash: await bcrypt.hash(Math.random().toString(36), SECURITY.BCRYPT_SALT_ROUNDS), // Random password for OAuth users
        },
      });

      // Auto-generate shop_slug (was previously missing on this mobile OAuth path)
      user = await prisma.users.update({
        where: { id: user.id },
        data: { shop_slug: generateShopSlug(user.full_name, user.id) },
      });

      console.log(`✅ New Google user created: ${email} (userId: ${user.id})`);

      // Send welcome notification (fire-and-forget)
      sendNotification({
        recipientUserIds: [user.id],
        type: 'welcome',
        title: 'Welcome to Thulo Bazaar!',
        body: 'Start browsing or post your first ad today. Happy selling!',
        data: { route: '/post-ad' },
      }).catch(err => console.error('Welcome notification error:', err));
    } else {
      // Update existing user with Google info if needed (e.g. if they didn't have googleId linked)
      if (!user.oauth_provider_id) {
        await prisma.users.update({
          where: { id: user.id },
          data: {
            oauth_provider: 'google',
            oauth_provider_id: googleId,
            avatar: user.avatar || picture, // Update avatar if missing
          },
        });
      }
    }

    if (user.is_suspended) {
      return { success: false, error: 'Your account has been suspended.' };
    }

    // Account deletion recovery for Google login
    let isPendingDeletion = false;
    if (user.deleted_at && user.deletion_requested_at) {
      const daysSinceDeletion = (Date.now() - user.deletion_requested_at.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDeletion >= RECOVERY_DAYS) {
        return { success: false, error: 'This account has been permanently deleted.' };
      }
      isPendingDeletion = true;
    } else if (!user.is_active) {
      return { success: false, error: 'Your account has been deactivated.' };
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    console.log(`📱 Google login successful (userId: ${user.id})${isPendingDeletion ? ' [pending deletion]' : ''}`);

    return {
      success: true,
      token: accessToken,
      refreshToken,
      isNewUser,
      ...(isPendingDeletion && {
        accountPendingDeletion: true,
        deletionDate: user.deletion_requested_at!.toISOString(),
      }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        role: user.role,
        shopSlug: user.shop_slug,
        accountType: user.account_type,
        avatar: user.avatar,
      },
    };

  } catch (error) {
    console.error('Google verification failed:', error);
    return { success: false, error: 'Google verification failed' };
  }
}

// ============================================================================
// Apple Auth Functions
// ============================================================================

export async function verifyAppleToken(
  identityToken: string,
  fullName?: { givenName?: string; familyName?: string },
): Promise<LoginResult> {
  try {
    const audience = process.env.APPLE_CLIENT_ID || 'com.thulobazaar.mobile';

    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience,
      ignoreExpiration: false,
    });

    if (!payload || !payload.sub) {
      return { success: false, error: 'Invalid Apple token payload' };
    }

    const appleUserId = payload.sub;
    const email = payload.email || null;
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

    let user = await prisma.users.findFirst({
      where: {
        OR: [
          { oauth_provider_id: appleUserId },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    let isNewUser = false;

    if (!user) {
      const registrationAllowed = await getBooleanSetting('allow_registration', true);
      if (!registrationAllowed) {
        return { success: false, error: 'New user registration is currently disabled' };
      }
      isNewUser = true;

      const composedName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim();

      user = await prisma.users.create({
        data: {
          email,
          full_name: composedName || 'Apple User',
          oauth_provider: 'apple',
          oauth_provider_id: appleUserId,
          email_verified: emailVerified,
          role: 'user',
          is_active: true,
          password_hash: await bcrypt.hash(Math.random().toString(36), SECURITY.BCRYPT_SALT_ROUNDS),
        },
      });

      // Auto-generate shop_slug (was previously missing on this mobile OAuth path)
      user = await prisma.users.update({
        where: { id: user.id },
        data: { shop_slug: generateShopSlug(user.full_name, user.id) },
      });

      console.log(`✅ New Apple user created: ${email || appleUserId} (userId: ${user.id})`);

      sendNotification({
        recipientUserIds: [user.id],
        type: 'welcome',
        title: 'Welcome to Thulo Bazaar!',
        body: 'Start browsing or post your first ad today. Happy selling!',
        data: { route: '/post-ad' },
      }).catch(err => console.error('Welcome notification error:', err));
    } else if (!user.oauth_provider_id) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          oauth_provider: 'apple',
          oauth_provider_id: appleUserId,
        },
      });
    }

    if (user.is_suspended) {
      return { success: false, error: 'Your account has been suspended.' };
    }

    let isPendingDeletion = false;
    if (user.deleted_at && user.deletion_requested_at) {
      const daysSinceDeletion = (Date.now() - user.deletion_requested_at.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDeletion >= RECOVERY_DAYS) {
        return { success: false, error: 'This account has been permanently deleted.' };
      }
      isPendingDeletion = true;
    } else if (!user.is_active) {
      return { success: false, error: 'Your account has been deactivated.' };
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    console.log(`📱 Apple login successful (userId: ${user.id})${isPendingDeletion ? ' [pending deletion]' : ''}`);

    return {
      success: true,
      token: accessToken,
      refreshToken,
      isNewUser,
      ...(isPendingDeletion && {
        accountPendingDeletion: true,
        deletionDate: user.deletion_requested_at!.toISOString(),
      }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        role: user.role,
        shopSlug: user.shop_slug,
        accountType: user.account_type,
        avatar: user.avatar,
      },
    };
  } catch (error) {
    console.error('Apple verification failed:', error);
    return { success: false, error: 'Apple verification failed' };
  }
}

// ============================================================================
// Security Settings Functions
// ============================================================================

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.password_hash) {
    return { success: false, error: 'Password change not available for this account type' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  const newHash = await bcrypt.hash(newPassword, SECURITY.BCRYPT_SALT_ROUNDS);
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: newHash },
  });

  // A password change is how someone ends a session they no longer trust, so the
  // refresh chain has to die with the old password. Access tokens already issued
  // stay valid until they expire; the refresh tokens are what would otherwise let
  // an attacker keep renewing indefinitely.
  const { count: revokedSessions } = await prisma.refresh_tokens.updateMany({
    where: { user_id: userId, is_revoked: false },
    data: { is_revoked: true },
  });

  return { success: true, revokedSessions };
}

export async function getSessions(userId: number) {
  const sessions = await prisma.refresh_tokens.findMany({
    where: { user_id: userId, is_revoked: false },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      created_at: true,
      expires_at: true,
    },
  });

  return { success: true, sessions };
}

export async function revokeSession(userId: number, sessionId: number) {
  const session = await prisma.refresh_tokens.findFirst({
    where: { id: sessionId, user_id: userId },
  });

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  await prisma.refresh_tokens.update({
    where: { id: sessionId },
    data: { is_revoked: true },
  });

  return { success: true };
}

// ============================================================================
// Two-Factor Authentication (TOTP) Functions
// ============================================================================

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;
const TWO_FA_APP_NAME = 'Thulo Bazaar';

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(crypto.randomBytes(BACKUP_CODE_LENGTH / 2).toString('hex'));
  }
  return codes;
}

export async function setup2FA(userId: number) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };

  if (user.two_factor_enabled) {
    return { success: false, error: '2FA is already enabled. Disable it first to re-setup.' };
  }

  const secret = generateSecret();
  const label = user.phone || user.email || `user-${userId}`;
  const otpauthUri = generateURI({ issuer: TWO_FA_APP_NAME, label, secret });
  const qrCode = await QRCode.toDataURL(otpauthUri);

  // Store secret (not yet enabled until verified)
  await prisma.users.update({
    where: { id: userId },
    data: { two_factor_secret: secret },
  });

  return { success: true, secret, qrCode, otpauthUri };
}

export async function verify2FASetup(userId: number, code: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!user.two_factor_secret) return { success: false, error: 'Please initiate 2FA setup first' };
  if (user.two_factor_enabled) return { success: false, error: '2FA is already enabled' };

  const isValid = verifySync({ secret: user.two_factor_secret, token: code }).valid;
  if (!isValid) return { success: false, error: 'Invalid verification code. Please try again.' };

  // Generate backup codes
  const plaintextCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(
    plaintextCodes.map(c => bcrypt.hash(c, SECURITY.BCRYPT_SALT_ROUNDS))
  );

  await prisma.users.update({
    where: { id: userId },
    data: {
      two_factor_enabled: true,
      two_factor_backup_codes: hashedCodes,
    },
  });

  return { success: true, backupCodes: plaintextCodes };
}

export async function disable2FA(userId: number, password: string, code: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!user.two_factor_enabled) return { success: false, error: '2FA is not enabled' };

  // Verify password
  if (!user.password_hash) return { success: false, error: 'Cannot verify identity' };
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) return { success: false, error: 'Invalid password' };

  // 🔒 AUTH-L5: when 2FA is enabled, ALWAYS require a valid TOTP code to disable it.
  // A null secret with two_factor_enabled=true is an inconsistent state — do NOT allow
  // password-alone disabling (that would be a second-factor bypass). Route the user to
  // an admin 2FA reset (editor `reset-2fa` endpoint) instead.
  if (!user.two_factor_secret) {
    return { success: false, error: '2FA is in an inconsistent state. Please contact support to reset it.' };
  }
  const isValid = verifySync({ secret: user.two_factor_secret, token: code }).valid;
  if (!isValid) return { success: false, error: 'Invalid 2FA code' };

  await prisma.users.update({
    where: { id: userId },
    data: {
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_backup_codes: Prisma.DbNull,
    },
  });

  return { success: true };
}

/**
 * Verify a 2FA code against a user's TOTP secret, falling back to (and
 * consuming) a bcrypt-hashed backup code. Shared by user 2FA login and the
 * editor/admin API login (🔒 API-2).
 */
export async function verifyTwoFactorCode(
  user: { id: number; two_factor_secret: string; two_factor_backup_codes: unknown },
  code: string
): Promise<boolean> {
  // Try TOTP first (wrap in try-catch — verifySync throws for non-6-digit codes
  // like backup codes, instead of returning {valid: false})
  let isValid = false;
  try {
    isValid = verifySync({ secret: user.two_factor_secret, token: code }).valid;
  } catch {
    // Not a valid TOTP format — fall through to backup code check
  }

  // If TOTP fails, try backup codes
  if (!isValid && user.two_factor_backup_codes) {
    const backupCodes = user.two_factor_backup_codes as string[];
    for (let i = 0; i < backupCodes.length; i++) {
      const match = await bcrypt.compare(code, backupCodes[i]);
      if (match) {
        isValid = true;
        // Remove used backup code
        const updatedCodes = [...backupCodes];
        updatedCodes.splice(i, 1);
        await prisma.users.update({
          where: { id: user.id },
          data: { two_factor_backup_codes: updatedCodes },
        });
        break;
      }
    }
  }

  return isValid;
}

export async function verify2FALogin(tempToken: string, code: string): Promise<LoginResult> {
  // Validate temp token
  let payload: { userId: number; purpose: string };
  try {
    payload = jwt.verify(tempToken, config.JWT_SECRET) as { userId: number; purpose: string };
  } catch {
    return { success: false, error: 'Invalid or expired 2FA session. Please login again.' };
  }

  if (payload.purpose !== '2fa') {
    return { success: false, error: 'Invalid token purpose' };
  }

  const user = await prisma.users.findUnique({ where: { id: payload.userId } });
  if (!user || !user.two_factor_secret) {
    return { success: false, error: 'User not found or 2FA not configured' };
  }

  const isValid = await verifyTwoFactorCode(
    { id: user.id, two_factor_secret: user.two_factor_secret, two_factor_backup_codes: user.two_factor_backup_codes },
    code
  );

  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Check if account is pending deletion (don't reactivate — let client decide)
  const isPendingDeletion = !!(user.deleted_at && user.deletion_requested_at);

  // Update last login
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  // Generate real tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  return {
    success: true,
    token: accessToken,
    refreshToken,
    ...(isPendingDeletion && {
      accountPendingDeletion: true,
      deletionDate: user.deletion_requested_at!.toISOString(),
    }),
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      phoneVerified: user.phone_verified,
      role: user.role,
      shopSlug: user.shop_slug,
      accountType: user.account_type,
      avatar: user.avatar,
    },
  };
}

// ============================================================================
// Account Deletion Functions
// ============================================================================

const DELETE_OTP_COOLDOWN_SECONDS = 60;
const DELETE_MAX_OTP_PER_HOUR = 3;

export async function requestAccountDeletion(userId: number) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (user.deleted_at) return { success: false, error: 'Account is already scheduled for deletion' };
  if (user.is_suspended) return { success: false, error: 'Cannot delete a suspended account. Contact support.' };
  if (!user.phone || !user.phone_verified) {
    return { success: false, error: 'A verified phone number is required to delete your account' };
  }

  // Cooldown check
  const recentOtp = await prisma.phone_otps.findFirst({
    where: {
      phone: user.phone,
      purpose: 'account_deletion',
      created_at: { gte: new Date(Date.now() - DELETE_OTP_COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { created_at: 'desc' },
  });

  if (recentOtp) {
    const secondsRemaining = Math.ceil(
      (DELETE_OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.created_at.getTime())) / 1000
    );
    return { success: false, error: `Please wait ${secondsRemaining} seconds`, cooldownRemaining: secondsRemaining };
  }

  // Rate limit check
  const recentAttempts = await prisma.phone_otps.count({
    where: {
      phone: user.phone,
      purpose: 'account_deletion',
      created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentAttempts >= DELETE_MAX_OTP_PER_HOUR) {
    return { success: false, error: 'Too many requests. Please try again after 1 hour.' };
  }

  // Invalidate previous OTPs
  await prisma.phone_otps.updateMany({
    where: { phone: user.phone, purpose: 'account_deletion', is_used: false },
    data: { is_used: true },
  });

  // Generate and send OTP
  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.phone_otps.create({
    data: {
      phone: user.phone,
      otp_code: otp,
      purpose: 'account_deletion',
      expires_at: expiresAt,
    },
  });

  const smsResult = await sendOtpSms(user.phone, otp, 'account_deletion' as OtpPurpose);
  if (!smsResult.success) {
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }

  // Mask phone: 98XXXX6096
  const maskedPhone = user.phone.slice(0, 2) + '****' + user.phone.slice(-4);

  return { success: true, phone: maskedPhone, expiresIn: 600 };
}

export async function confirmAccountDeletion(userId: number, otp: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!user.phone) return { success: false, error: 'Phone number not found' };
  if (user.deleted_at) return { success: false, error: 'Account is already scheduled for deletion' };

  // Find valid OTP
  const otpRecord = await prisma.phone_otps.findFirst({
    where: {
      phone: user.phone,
      purpose: 'account_deletion',
      is_used: false,
      expires_at: { gte: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otpRecord) return { success: false, error: 'Invalid or expired code. Please request a new one.' };

  if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.phone_otps.update({ where: { id: otpRecord.id }, data: { is_used: true } });
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  if (!timingSafeEqualStr(otpRecord.otp_code, otp)) {
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;
    return { success: false, error: `Invalid code. ${remaining} attempts remaining.`, remainingAttempts: remaining };
  }

  // Soft-delete in transaction
  const now = new Date();
  const recoveryDeadline = new Date(now.getTime() + RECOVERY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    }),
    prisma.users.update({
      where: { id: userId },
      data: {
        deleted_at: now,
        deletion_requested_at: now,
        is_active: false,
      },
    }),
    // Revoke all refresh tokens
    prisma.refresh_tokens.updateMany({
      where: { user_id: userId },
      data: { is_revoked: true },
    }),
  ]);

  return { success: true, recoveryDeadline: recoveryDeadline.toISOString() };
}

/**
 * Cancel account deletion — reactivates the account within the 30-day recovery window.
 * Called when a user logs in and chooses "Keep my account".
 */
export async function cancelAccountDeletion(userId: number): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.users.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!user.deleted_at || !user.deletion_requested_at) {
    return { success: false, error: 'Account is not pending deletion' };
  }

  const daysSinceDeletion = (Date.now() - user.deletion_requested_at.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDeletion >= RECOVERY_DAYS) {
    return { success: false, error: 'Recovery window has expired. Account has been permanently deleted.' };
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      deleted_at: null,
      deletion_requested_at: null,
      is_active: true,
    },
  });

  console.log(`🔄 Account deletion cancelled by user (userId: ${userId})`);

  return { success: true };
}
