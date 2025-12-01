import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import { SECURITY } from '../config/constants.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { catchAsync, ValidationError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { email, password, fullName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      throw new ValidationError('Email, password, and full name are required');
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);

    // Generate shop_slug from full name
    let shopSlug = generateSlug(fullName);

    // Check if slug already exists and make it unique
    const existingSlug = await prisma.users.findFirst({
      where: {
        OR: [{ shop_slug: shopSlug }, { seller_slug: shopSlug }],
      },
    });

    if (existingSlug) {
      shopSlug = `${shopSlug}-${Date.now()}`;
    }

    // Insert user with shop_slug
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone: phone || null,
        shop_slug: shopSlug,
        seller_slug: shopSlug,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        created_at: true,
        account_type: true,
        shop_slug: true,
        seller_slug: true,
        business_verification_status: true,
        individual_verified: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`✅ User registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          createdAt: user.created_at,
          account_type: user.account_type,
          shop_slug: user.shop_slug,
          seller_slug: user.seller_slug,
          business_verification_status: user.business_verification_status,
          individual_verified: user.individual_verified,
        },
        token,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Login a user
 */
router.post(
  '/login',
  rateLimiters.auth,
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        full_name: true,
        phone: true,
        location_id: true,
        is_active: true,
        role: true,
        account_type: true,
        shop_slug: true,
        seller_slug: true,
        business_verification_status: true,
        individual_verified: true,
      },
    });

    if (!user) {
      throw new ValidationError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new ValidationError('Account is deactivated');
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!passwordMatch) {
      throw new ValidationError('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`✅ User logged in: ${user.email} (userId: ${user.id})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          locationId: user.location_id,
          role: user.role,
          account_type: user.account_type,
          shop_slug: user.shop_slug,
          seller_slug: user.seller_slug,
          business_verification_status: user.business_verification_status,
          individual_verified: user.individual_verified,
        },
        token,
      },
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

export default router;
