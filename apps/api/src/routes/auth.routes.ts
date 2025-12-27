import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { catchAsync, ValidationError } from '../middleware/errorHandler.js';
import {
  validateNepaliPhone,
  formatPhoneNumber,
  generateOtp,
  sendOtpSms,
  getOtpExpiry,
  type OtpPurpose,
} from '../lib/sms.js';

const MAX_OTP_ATTEMPTS = 3;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

const router = Router();

/**
 * POST /api/auth/register
 * DEPRECATED: Email registration removed. Use phone registration via Next.js API.
 * This endpoint returns an error directing users to register via phone or OAuth.
 */
router.post(
  '/register',
  rateLimiters.auth,
  catchAsync(async (_req: Request, res: Response) => {
    res.status(400).json({
      success: false,
      message: 'Email registration is no longer supported. Please register using phone number or Google/Facebook.',
    });
  })
);

/**
 * POST /api/auth/login
 * DEPRECATED: Email/password login removed.
 * Users should login via phone OTP or Google/Facebook OAuth.
 */
router.post(
  '/login',
  rateLimiters.auth,
  catchAsync(async (_req: Request, res: Response) => {
    res.status(400).json({
      success: false,
      message: 'Email login is no longer supported. Please login using phone number or Google/Facebook.',
    });
  })
);

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token for messaging (no password required, uses existing NextAuth session)
 */
router.post(
  '/refresh-token',
  catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: {
        email,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Generate fresh JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`🔄 Token refreshed for: ${user.email} (userId: ${user.id})`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
      },
    });
  })
);

/**
 * GET /api/auth/google
 * Redirect to Google for authentication
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * GET /api/auth/callback/google
 * Google callback URL
 */
router.get(
  '/callback/google',
  passport.authenticate('google', {
    failureRedirect: `${config.FRONTEND_URL}/en/auth/signin?error=OAuthAccountNotLinked`,
    session: false
  }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const user = req.user;

    if (!user) {
      return res.redirect(`${config.FRONTEND_URL}/en/auth/signin?error=NoUser`);
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role || 'user' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`✅ Google OAuth success for: ${user.email}`);

    // Redirect to frontend with token - frontend will handle storing it
    res.redirect(`${config.FRONTEND_URL}/api/auth/oauth-callback?token=${token}&provider=google`);
  }
);

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number for registration, login, or password reset
 */
router.post(
  '/send-otp',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, purpose = 'registration' } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phone);

    if (!validateNepaliPhone(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.',
      });
    }

    // Validate purpose
    const validPurposes = ['registration', 'login', 'password_reset', 'phone_verification'];
    if (!validPurposes.includes(purpose)) {
      throw new ValidationError('Invalid purpose');
    }

    // For registration, check if phone is already registered
    if (purpose === 'registration') {
      const existingUser = await prisma.users.findFirst({
        where: { phone: formattedPhone, phone_verified: true },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered',
        });
      }
    }

    // For login, check if phone is registered
    if (purpose === 'login') {
      const existingUser = await prisma.users.findFirst({
        where: {
          phone: formattedPhone,
          phone_verified: true,
          is_active: true,
        },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number',
        });
      }

      if (existingUser.is_suspended) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.',
        });
      }
    }

    // For password_reset, check if account exists
    if (purpose === 'password_reset') {
      const existingUser = await prisma.users.findFirst({
        where: { phone: formattedPhone, is_active: true },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this phone number',
        });
      }

      if (existingUser.is_suspended) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact support.',
        });
      }
    }

    // Check for recent OTP (cooldown)
    const recentOtp = await prisma.phone_otps.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        created_at: {
          gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000),
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (recentOtp) {
      const secondsRemaining = Math.ceil(
        (OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.created_at.getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsRemaining} seconds before requesting a new OTP`,
        cooldownRemaining: secondsRemaining,
      });
    }

    // Check if user has exceeded max attempts in last hour
    const recentAttempts = await prisma.phone_otps.count({
      where: {
        phone: formattedPhone,
        purpose,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 1 hour.',
      });
    }

    // Invalidate previous unused OTPs
    await prisma.phone_otps.updateMany({
      where: {
        phone: formattedPhone,
        purpose,
        is_used: false,
      },
      data: {
        is_used: true,
      },
    });

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiry();

    // Save OTP to database
    await prisma.phone_otps.create({
      data: {
        phone: formattedPhone,
        otp_code: otp,
        purpose,
        expires_at: expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(formattedPhone, otp, purpose as OtpPurpose);

    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }

    console.log(`📱 OTP sent to ${formattedPhone} for ${purpose}`);

    res.json({
      success: true,
      message: 'OTP sent successfully via SMS',
      identifier: formattedPhone,
      expiresIn: 600, // 10 minutes in seconds
    });
  })
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return verification token
 */
router.post(
  '/verify-otp',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, otp, purpose = 'registration' } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    if (!otp || otp.length !== 6) {
      throw new ValidationError('OTP must be 6 digits');
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Find the most recent valid OTP
    const otpRecord = await prisma.phone_otps.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        is_used: false,
        expires_at: {
          gte: new Date(),
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP.',
      });
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      await prisma.phone_otps.update({
        where: { id: otpRecord.id },
        data: { is_used: true },
      });

      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      await prisma.phone_otps.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        remainingAttempts,
      });
    }

    // OTP is valid - mark as used (except for password_reset)
    if (purpose !== 'password_reset') {
      await prisma.phone_otps.update({
        where: { id: otpRecord.id },
        data: { is_used: true },
      });
    }

    console.log(`✅ OTP verified for ${formattedPhone} (${purpose})`);

    // Return verification token
    const verificationToken = Buffer.from(
      JSON.stringify({
        identifier: formattedPhone,
        purpose,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      })
    ).toString('base64');

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      identifier: formattedPhone,
      verificationToken,
    });
  })
);

/**
 * POST /api/auth/phone-login
 * Login with phone number and password
 */
router.post(
  '/phone-login',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, password } = req.body;

    if (!phone) {
      throw new ValidationError('Phone number is required');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    const formattedPhone = formatPhoneNumber(phone);

    if (!validateNepaliPhone(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
      });
    }

    // Find user with this phone number
    const user = await prisma.users.findFirst({
      where: {
        phone: formattedPhone,
        phone_verified: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    if (user.is_suspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`📱 Phone login successful for ${formattedPhone} (userId: ${user.id})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
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
    });
  })
);

/**
 * POST /api/auth/register-phone
 * Register new user with phone number (after OTP verification)
 */
router.post(
  '/register-phone',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, password, fullName, verificationToken } = req.body;

    if (!phone || !password || !fullName) {
      throw new ValidationError('Phone, password, and full name are required');
    }

    if (!verificationToken) {
      throw new ValidationError('Phone verification is required');
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Verify the verification token
    try {
      const tokenData = JSON.parse(Buffer.from(verificationToken, 'base64').toString());

      if (tokenData.identifier !== formattedPhone) {
        throw new Error('Token mismatch');
      }

      if (tokenData.purpose !== 'registration') {
        throw new Error('Invalid token purpose');
      }

      if (Date.now() > tokenData.expiresAt) {
        throw new Error('Token expired');
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token. Please verify your phone again.',
      });
    }

    // Check if phone is already registered
    const existingUser = await prisma.users.findFirst({
      where: { phone: formattedPhone, phone_verified: true },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already registered',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.users.create({
      data: {
        phone: formattedPhone,
        phone_verified: true,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'user',
        is_active: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`📱 New user registered via phone: ${formattedPhone} (userId: ${user.id})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        phoneVerified: user.phone_verified,
        role: user.role,
      },
    });
  })
);

/**
 * POST /api/auth/reset-password
 * Reset password using OTP verification token
 */
router.post(
  '/reset-password',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { phone, newPassword, verificationToken } = req.body;

    if (!phone || !newPassword) {
      throw new ValidationError('Phone and new password are required');
    }

    if (!verificationToken) {
      throw new ValidationError('Verification token is required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Verify the verification token
    try {
      const tokenData = JSON.parse(Buffer.from(verificationToken, 'base64').toString());

      if (tokenData.identifier !== formattedPhone) {
        throw new Error('Token mismatch');
      }

      if (tokenData.purpose !== 'password_reset') {
        throw new Error('Invalid token purpose');
      }

      if (Date.now() > tokenData.expiresAt) {
        throw new Error('Token expired');
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token. Please verify your phone again.',
      });
    }

    // Find user
    const user = await prisma.users.findFirst({
      where: { phone: formattedPhone },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number',
      });
    }

    // Mark the OTP as used
    await prisma.phone_otps.updateMany({
      where: {
        phone: formattedPhone,
        purpose: 'password_reset',
        is_used: false,
      },
      data: { is_used: true },
    });

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: passwordHash },
    });

    console.log(`🔐 Password reset successful for ${formattedPhone}`);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  })
);

export default router;
