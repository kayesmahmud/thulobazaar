import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar: true,
        bio: true,
        location_id: true,
        account_type: true,
        shop_slug: true,
        seller_slug: true,
        custom_shop_slug: true,
        business_name: true,
        business_verification_status: true,
        individual_verified: true,
        created_at: true,
        locations: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        locationId: user.location_id,
        locationName: (user as any).locations?.name,
        accountType: user.account_type,
        shopSlug: user.custom_shop_slug || user.shop_slug,
        businessName: user.business_name,
        businessVerificationStatus: user.business_verification_status,
        individualVerified: user.individual_verified,
        createdAt: user.created_at,
      },
    });
  })
);

/**
 * PUT /api/profile
 * Update current user's profile
 */
router.put(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { fullName, phone, bio, locationId } = req.body;

    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        full_name: fullName,
        phone: phone || null,
        bio: bio || null,
        location_id: locationId ? parseInt(locationId) : null,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Profile updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        bio: user.bio,
      },
    });
  })
);

/**
 * GET /api/profile/:userId
 * Get public profile by user ID
 */
router.get(
  '/:userId',
  catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        full_name: true,
        avatar: true,
        bio: true,
        account_type: true,
        shop_slug: true,
        custom_shop_slug: true,
        business_name: true,
        business_verification_status: true,
        individual_verified: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user's ads count
    const adsCount = await prisma.ads.count({
      where: { user_id: parseInt(userId), status: 'approved' },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.full_name,
        avatar: user.avatar,
        bio: user.bio,
        accountType: user.account_type,
        shopSlug: user.custom_shop_slug || user.shop_slug,
        businessName: user.business_name,
        businessVerificationStatus: user.business_verification_status,
        individualVerified: user.individual_verified,
        createdAt: user.created_at,
        adsCount,
      },
    });
  })
);

export default router;
