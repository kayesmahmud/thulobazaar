import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { catchAsync, ValidationError } from '../middleware/errorHandler.js';

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

export default router;
