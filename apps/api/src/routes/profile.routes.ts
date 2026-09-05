import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadAvatar, uploadCover } from '../middleware/upload.js';
import { optimizeImage } from '../middleware/optimizeImage.js';
import { unlink } from 'fs/promises';
import path from 'path';
import config from '../config/index.js';
import { computeCanDirectPublish } from '../services/ad.service.js';

const router = Router();

/**
 * Builds the canonical "full profile" response shape (camelCase).
 * Shared by GET and PUT so the client always receives the complete object —
 * a partial response would wipe fields like phoneVerified on the client.
 */
async function getCurrentUserProfile(userId: number) {
  const [user, passwordCheck] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        phone_verified_at: true,
        avatar: true,
        bio: true,
        location_id: true,
        account_type: true,
        shop_slug: true,
        custom_shop_slug: true,
        business_name: true,
        business_verification_status: true,
        business_verification_expires_at: true,
        direct_edit_revoked: true,
        individual_verified: true,
        created_at: true,
        locations: true,
        oauth_provider: true,
        two_factor_enabled: true,
        default_category_id: true,
        default_subcategory_id: true,
      },
    }),
    // Separate minimal query — avoids loading the hash into the main user object
    prisma.users.findUnique({
      where: { id: userId },
      select: { password_hash: true, two_factor_secret: true },
    }),
  ]);

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    phoneVerified: user.phone_verified,
    phoneVerifiedAt: user.phone_verified_at,
    avatar: user.avatar,
    bio: user.bio,
    locationId: user.location_id,
    location: user.locations,
    locationName: (user as any).locations?.name,
    // Shop-page defaults (Categories tab) — post-ad forms prefill from these
    categoryId: user.default_category_id,
    subcategoryId: user.default_subcategory_id,
    accountType: user.account_type,
    shopSlug: user.custom_shop_slug || user.shop_slug,
    customShopSlug: user.custom_shop_slug,
    businessName: user.business_name,
    businessVerificationStatus: user.business_verification_status,
    individualVerified: user.individual_verified,
    // Direct-publish privilege: currently business-verified, not expired, not revoked
    canDirectPublish: computeCanDirectPublish(user),
    createdAt: user.created_at,
    oauthProvider: user.oauth_provider,
    hasPassword: !!passwordCheck?.password_hash,
    twoFactorEnabled: user.two_factor_enabled && !!passwordCheck?.two_factor_secret,
  };
}

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const profile = await getCurrentUserProfile(req.user!.userId);

    if (!profile) {
      throw new NotFoundError('User not found');
    }

    res.json({ success: true, data: profile });
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
    const { fullName, bio, locationId } = req.body;

    // Build update data - only include fields that are explicitly provided
    // NOTE: phone is NOT updated here - it's managed through phone verification flow
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (fullName !== undefined) updateData.full_name = fullName;
    if (bio !== undefined) updateData.bio = bio || null;
    if (locationId !== undefined) updateData.location_id = locationId ? parseInt(locationId) : null;

    await prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(`✅ Profile updated for user ${userId}`);

    // Return the complete profile (same shape as GET) so the client doesn't
    // drop fields like phoneVerified when it replaces its local user state.
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: await getCurrentUserProfile(userId),
    });
  })
);


/**
 * PATCH /api/profile
 * Update shop profile details (bio, business info)
 */
router.patch(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { bio, businessName, businessDescription } = req.body;

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    if (bio !== undefined) updateData.bio = bio;
    if (businessName !== undefined) updateData.business_name = businessName;
    if (businessDescription !== undefined) updateData.business_description = businessDescription;

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      success: true,
      data: await getUserProfile(userId) || user,
    });
  })
);

/**
 * PATCH /api/profile/contact
 * Update shop contact details
 */
router.patch(
  '/contact',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { businessPhone, businessWebsite, googleMapsLink, facebookUrl, instagramUrl, tiktokUrl } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: {
        business_phone: businessPhone,
        business_website: businessWebsite,
        google_maps_link: googleMapsLink,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        tiktok_url: tiktokUrl,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: await getUserProfile(userId),
    });
  })
);

/**
 * PATCH /api/profile/category
 * Update shop default category
 */
router.patch(
  '/category',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { categoryId, subcategoryId } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: {
        default_category_id: categoryId,
        default_subcategory_id: subcategoryId,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: await getUserProfile(userId),
    });
  })
);

/**
 * PATCH /api/profile/location
 * Update shop location
 */
router.patch(
  '/location',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { locationSlug } = req.body;

    let locationId: number | null = null;
    if (locationSlug) {
      const location = await prisma.locations.findUnique({
        where: { slug: locationSlug },
      });
      if (!location) {
        throw new NotFoundError('Location not found');
      }
      locationId = location.id;
    }

    await prisma.users.update({
      where: { id: userId },
      data: {
        location_id: locationId,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      data: await getUserProfile(userId),
    });
  })
);

/**
 * POST /api/profile/avatar
 * Upload user avatar
 */
router.post(
  '/avatar',
  authenticateToken,
  uploadAvatar.single('avatar'),
  optimizeImage('avatar'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Get old avatar to delete it later
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Update user's avatar in database
    await prisma.users.update({
      where: { id: userId },
      data: {
        avatar: req.file.filename,
        updated_at: new Date(),
      },
    });

    // Delete old avatar file if it exists and is not an external URL
    if (user?.avatar && !user.avatar.startsWith('http')) {
      const oldPath = path.join(config.UPLOAD_DIR, 'avatars', user.avatar);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.log('Old avatar file not found or already deleted');
      }
    }

    console.log(`🖼️ Avatar uploaded for user ${userId}: ${req.file.filename}`);

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: req.file.filename,
        url: `/uploads/avatars/${req.file.filename}`,
      },
    });
  })
);

/**
 * DELETE /api/profile/avatar
 * Remove user avatar
 */
router.delete(
  '/avatar',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get current avatar
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user?.avatar) {
      return res.status(404).json({
        success: false,
        message: 'No avatar to delete',
      });
    }

    // Remove from database
    await prisma.users.update({
      where: { id: userId },
      data: {
        avatar: null,
        updated_at: new Date(),
      },
    });

    // Delete file if it's not an external URL
    if (!user.avatar.startsWith('http')) {
      const filePath = path.join(config.UPLOAD_DIR, 'avatars', user.avatar);
      try {
        await unlink(filePath);
      } catch (err) {
        console.log('Avatar file not found or already deleted');
      }
    }

    console.log(`🗑️ Avatar removed for user ${userId}`);

    res.json({
      success: true,
      message: 'Avatar removed successfully',
    });
  })
);

/**
 * POST /api/profile/cover
 * Upload user cover photo
 */
router.post(
  '/cover',
  authenticateToken,
  uploadCover.single('cover'),
  optimizeImage('cover'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Get old cover to delete it later
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { cover_photo: true },
    });

    // Update user's cover photo in database
    await prisma.users.update({
      where: { id: userId },
      data: {
        cover_photo: req.file.filename,
        updated_at: new Date(),
      },
    });

    // Delete old cover file if it exists and is not an external URL
    if (user?.cover_photo && !user.cover_photo.startsWith('http')) {
      const oldPath = path.join(config.UPLOAD_DIR, 'covers', user.cover_photo);
      try {
        await unlink(oldPath);
      } catch (err) {
        console.log('Old cover file not found or already deleted');
      }
    }

    console.log(`🖼️ Cover photo uploaded for user ${userId}: ${req.file.filename}`);

    res.json({
      success: true,
      message: 'Cover photo uploaded successfully',
      data: {
        cover: req.file.filename,
        url: `/uploads/covers/${req.file.filename}`,
      },
    });
  })
);

/**
 * DELETE /api/profile/cover
 * Remove user cover photo
 */
router.delete(
  '/cover',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get current cover
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { cover_photo: true },
    });

    if (!user?.cover_photo) {
      return res.status(404).json({
        success: false,
        message: 'No cover photo to delete',
      });
    }

    // Remove from database
    await prisma.users.update({
      where: { id: userId },
      data: {
        cover_photo: null,
        updated_at: new Date(),
      },
    });

    // Delete file if it's not an external URL
    if (!user.cover_photo.startsWith('http')) {
      const filePath = path.join(config.UPLOAD_DIR, 'covers', user.cover_photo);
      try {
        await unlink(filePath);
      } catch (err) {
        console.log('Cover file not found or already deleted');
      }
    }

    console.log(`🗑️ Cover photo removed for user ${userId}`);

    res.json({
      success: true,
      message: 'Cover photo removed successfully',
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
      where: { id: parseInt(userId as string) },
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
      where: { user_id: parseInt(userId as string), status: 'approved' },
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

// Helper function to get full profile response
async function getUserProfile(userId: number) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      locations: true,
      default_category: true,
      default_subcategory: true,
    }
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    avatar: user.avatar,
    coverPhoto: user.cover_photo,
    bio: user.bio,
    businessDescription: user.business_description,
    businessPhone: user.business_phone,
    businessWebsite: user.business_website,
    googleMapsLink: user.google_maps_link,
    facebookUrl: user.facebook_url,
    instagramUrl: user.instagram_url,
    tiktokUrl: user.tiktok_url,
    locationId: user.location_id,
    locationName: user.locations?.name,
    locationFullPath: user.locations?.slug,
    categoryId: user.default_category_id,
    categoryName: user.default_category?.name,
    categorySlug: user.default_category?.slug,
    categoryIcon: user.default_category?.icon,
    subcategoryId: user.default_subcategory_id,
    subcategoryName: user.default_subcategory?.name,
    subcategorySlug: user.default_subcategory?.slug,
    subcategoryIcon: user.default_subcategory?.icon,

    accountType: user.account_type,
    shopSlug: user.custom_shop_slug || user.shop_slug,
    customShopSlug: user.custom_shop_slug,
    businessName: user.business_name,
    businessVerificationStatus: user.business_verification_status,
    individualVerified: user.individual_verified,
    createdAt: user.created_at,
  };
}

export default router;
