import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { uploadAdImages, uploadAiDraftImages, uploadStagedAdImage } from '../middleware/upload.js';
import { optimizeImage } from '../middleware/optimizeImage.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import {
  getAds,
  getUserAds,
  getAdBySlug,
  getAdById,
  incrementAdViews,
  createAd,
  createAdImages,
  getAdForEdit,
  updateAd,
  updateAdImages,
  deleteAd,
  getDirectPublishInfo,
  seedShopDefaultsFromAd,
  consumeStagedImages,
  sweepStagedImages,
  recordAdEditSnapshot,
  countLiveEditsThisMonth,
  getAdEditHistoryForOwner,
  MAX_LIVE_EDITS_PER_MONTH,
  validateAdLocation,
  validateAdCondition,
  findDuplicateAdForUser,
  AD_DUPLICATE_PENDING_MESSAGE,
  AD_DUPLICATE_LIVE_MESSAGE,
} from '../services/ad.service.js';
import { logReviewHistory } from '../utils/responseHelpers.js';
import {
  getAdLimits,
  isUserVerified,
  countUserActiveAds,
  AD_LIMIT_REACHED_CODE,
  calculateExpiresAt,
  getBooleanSetting,
} from '../services/adLimits.service.js';
import { sendNotification, notifyEditors } from '../services/notification.service.js';
import { moderateNewAd, auditLiveAd, buildEditContext } from '../services/moderation.service.js';
import { shouldPrecheck, precheckAd } from '../services/precheck.service.js';
import { isAutofillAvailable, draftFromImages } from '../services/autofill.service.js';
import { reportAiViolation } from '../services/userReport.service.js';
import { imageBuffersToDataUrls } from '../lib/ai/images.js';

const router = Router();

// ============================================================================
// Input Parsers
// ============================================================================

// 🔒 API-M1: bound the free-form attributes payload — it's stored verbatim into
// custom_fields and echoed on the detail response, so an unbounded/oversized blob
// is a payload-DoS + stored-data surface.
const MAX_ATTRIBUTES_BYTES = 8 * 1024; // 8KB
const MAX_ATTRIBUTE_KEYS = 50;

function parseAttributes(attributesStr?: string): Record<string, unknown> {
  if (!attributesStr) return {};
  if (Buffer.byteLength(attributesStr, 'utf8') > MAX_ATTRIBUTES_BYTES) {
    throw new ValidationError('Attributes payload is too large');
  }
  try {
    const parsed = JSON.parse(attributesStr);
    // Only accept a flat-ish plain object; reject arrays/primitives/null.
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    if (Object.keys(parsed).length > MAX_ATTRIBUTE_KEYS) {
      throw new ValidationError('Too many attributes');
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    console.error('❌ Failed to parse attributes:', err);
    return {};
  }
}

// Staged image ids arrive as a JSON-string array field alongside the normal
// form fields (clients keep sending multipart, just without the heavy files).
const MAX_STAGED_IMAGES = 10;
function parseStagedImages(stagedStr?: string): string[] {
  if (!stagedStr) return [];
  try {
    const parsed = JSON.parse(stagedStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === 'string').slice(0, MAX_STAGED_IMAGES);
  } catch {
    return [];
  }
}

function parseExistingImages(existingImagesStr?: string): string[] {
  if (!existingImagesStr) return [];
  try {
    return JSON.parse(existingImagesStr);
  } catch (err) {
    console.error('❌ Failed to parse existingImages:', err);
    return [];
  }
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/ads
 * Get all approved ads with filters
 */
router.get(
  '/',
  catchAsync(async (req: Request, res: Response) => {
    const result = await getAds({
      search: req.query.search as string,
      category: (req.query.category || req.query.category_id) as string,
      subcategory: (req.query.subcategory || req.query.subcategory_id) as string,
      location: (req.query.location || req.query.location_id) as string,
      minPrice: req.query.minPrice as string,
      maxPrice: req.query.maxPrice as string,
      condition: req.query.condition as string,
      sortBy: req.query.sortBy as string,
      limit: req.query.limit as string,
      offset: req.query.offset as string,
      isFeatured: req.query.is_featured as string,
    });

    // Short-lived cache — new ads can be approved at any time
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    res.json({
      success: true,
      data: result.ads,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/ads/my-ads
 * Get current user's ads
 */
router.get(
  '/my-ads',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ads = await getUserAds(userId);

    res.json({
      success: true,
      data: ads,
    });
  })
);

/**
 * GET /api/ads/slug/:slug
 * Get ad by SEO slug
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const ad = await getAdBySlug(slug, req.user?.userId);

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await incrementAdViews(ad.id);
    if (req.user?.userId) {
      prisma.ad_views.create({
        data: { ad_id: ad.id, user_id: req.user.userId, ip_address: req.ip },
      }).catch(() => {});
    }
    res.json({ success: true, data: ad });
  })
);

/**
 * GET /api/ads/:id
 * Get ad by ID or slug
 */
router.get(
  '/:id',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const ad = !isNaN(Number(id))
      ? await getAdById(parseInt(id), req.user?.userId)
      : await getAdBySlug(id, req.user?.userId);

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await incrementAdViews(ad.id);
    if (req.user?.userId) {
      prisma.ad_views.create({
        data: { ad_id: ad.id, user_id: req.user.userId, ip_address: req.ip },
      }).catch(() => {});
    }
    res.json({ success: true, data: ad });
  })
);

/**
 * POST /api/ads/stage-image
 * Background upload: one photo, staged into the user's own staging folder and
 * AVIF-converted immediately, so Post Ad only has to MOVE files (instant).
 * The returned stagedId is the staged filename; it can only ever be consumed
 * from this user's folder. Abandoned files are swept after 24h.
 */
router.post(
  '/stage-image',
  authenticateToken,
  rateLimiters.imageStaging,
  uploadStagedAdImage.single('image'),
  optimizeImage('ad'),
  catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('An image file is required');
    }
    // Piggyback cleanup of this user's stale staged files — no cron needed
    sweepStagedImages(req.user!.userId).catch(() => {});
    res.status(201).json({ success: true, data: { stagedId: req.file.filename } });
  })
);

/**
 * POST /api/ads/ai-draft
 * Phase 2 AI autofill: draft a listing from photos. Images are processed in
 * memory only — never stored. Fail-open: data is null whenever AI is off or
 * unavailable, and clients then simply show no suggestions.
 */
router.post(
  '/ai-draft',
  authenticateToken,
  rateLimiters.aiDraft,
  uploadAiDraftImages.array('images', 3),
  catchAsync(async (req: Request, res: Response) => {
    if (!(await isAutofillAvailable())) {
      return res.json({ success: true, data: null });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      throw new ValidationError('At least one image is required');
    }

    const imageDataUrls = await imageBuffersToDataUrls(files.map((f) => f.buffer));
    if (imageDataUrls.length === 0) {
      return res.json({ success: true, data: null });
    }

    const draft = await draftFromImages(imageDataUrls);
    // Prohibited sexual/nude content → auto-report the uploader to the editor
    // panel's user reports (fire-and-forget; the client hard-blocks the photos).
    // Banned items ('prohibited') are only warned here — the report happens at
    // ad submission, when the seller actually tries to list the item.
    if (draft?.unsellableReason === 'explicit') {
      reportAiViolation(req.user!.userId, 'ai-draft', 'explicit').catch((err) =>
        console.error('AI violation report error:', err)
      );
    }
    res.json({ success: true, data: draft });
  })
);

/**
 * POST /api/ads/ai-precheck
 * Pre-post AI check on manually-typed fields: category mismatch + clear
 * spelling mistakes, returned as advisory warnings for the confirm dialog.
 * Fail-open: switch off / AI trouble = empty warnings, posting unaffected.
 */
router.post(
  '/ai-precheck',
  authenticateToken,
  rateLimiters.aiDraft,
  catchAsync(async (req: Request, res: Response) => {
    if (!(await shouldPrecheck())) {
      return res.json({ success: true, data: { warnings: [] } });
    }
    const { title, description, categoryName, price } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.json({ success: true, data: { warnings: [] } });
    }
    const warnings = await precheckAd({
      title: title.slice(0, 150),
      description: typeof description === 'string' ? description.slice(0, 1000) : null,
      categoryName: typeof categoryName === 'string' ? categoryName.slice(0, 60) : null,
      price: typeof price === 'number' && Number.isFinite(price) ? price : null,
    });
    res.json({ success: true, data: { warnings } });
  })
);

/**
 * POST /api/ads
 * Create a new ad with images (multipart/form-data)
 */
router.post(
  '/',
  authenticateToken,
  uploadAdImages.array('images', 10),
  optimizeImage('ad'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { title, description, price, categoryId, subcategoryId, locationId, attributes } = req.body;

    console.log('📥 Ad creation request:', {
      userId,
      title,
      categoryId,
      subcategoryId,
      files: req.files ? (req.files as Express.Multer.File[]).length : 0,
    });

    // Check phone verification if required
    const requirePhoneVerification = await getBooleanSetting('require_phone_verification', true);
    if (requirePhoneVerification) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { phone_verified: true },
      });
      if (!user?.phone_verified) {
        throw new ValidationError('Phone verification is required before posting ads');
      }
    }

    // Validate required fields
    if (!title || !description || !categoryId) {
      throw new ValidationError('Title, description, and category are required');
    }

    if (!locationId) {
      throw new ValidationError('Location is required');
    }

    const locationError = await validateAdLocation(parseInt(locationId));
    if (locationError) {
      throw new ValidationError(locationError);
    }

    // Impatient-repost guard: same seller, same title, first copy still
    // pending or already live → refuse instead of creating a duplicate.
    const duplicate = await findDuplicateAdForUser(userId, String(title));
    if (duplicate) {
      throw new ValidationError(
        duplicate.status === 'pending' ? AD_DUPLICATE_PENDING_MESSAGE : AD_DUPLICATE_LIVE_MESSAGE
      );
    }

    // Enforce ad limits from site_settings (tiered by verification status)
    const [limits, verified, activeAdCount] = await Promise.all([
      getAdLimits(),
      isUserVerified(userId),
      countUserActiveAds(userId),
    ]);

    const maxActiveAds = verified ? limits.maxAdsPerUser : limits.freeAdsLimit;
    const imageLimit = verified ? limits.maxImagesVerified : limits.maxImagesUnverified;

    if (activeAdCount >= maxActiveAds) {
      const limitError = new ValidationError(
        verified
          ? `You have reached the maximum limit of ${maxActiveAds} ads`
          : `You have reached the limit of ${maxActiveAds} ads for unverified accounts. Get verified to post up to ${limits.maxAdsPerUser} ads`
      );
      limitError.code = AD_LIMIT_REACHED_CODE;
      limitError.details = { limit: maxActiveAds, verifiedLimit: limits.maxAdsPerUser, verified };
      throw limitError;
    }

    // Enforce image limit based on verification status
    const files = req.files as Express.Multer.File[];
    if (files && files.length > imageLimit) {
      throw new ValidationError(`You can upload a maximum of ${imageLimit} images per ad`);
    }

    // 🔒 API-M2: validate price is a non-negative finite number (0 = free).
    // Prevents negative/NaN prices being persisted.
    let parsedPrice: number | undefined;
    if (price !== undefined && price !== null && price !== '') {
      parsedPrice = parseFloat(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new ValidationError('Price must be a valid non-negative number');
      }
    }

    // Parse attributes
    const parsedAttributes = parseAttributes(attributes);
    const condition = (parsedAttributes.condition as string) || undefined;
    const { condition: _cond, ...customFields } = parsedAttributes;

    const conditionError = await validateAdCondition(
      subcategoryId ? parseInt(subcategoryId) : parseInt(categoryId),
      condition
    );
    if (conditionError) {
      throw new ValidationError(conditionError);
    }

    // Trusted business users (verified, not expired, not revoked) publish directly
    const publishInfo = await getDirectPublishInfo(userId);

    // Create ad with expiry
    const ad = await createAd(userId, {
      title,
      description,
      price: parsedPrice,
      categoryId: parseInt(categoryId),
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      condition,
      customFields,
      expiresAt: calculateExpiresAt(limits.adExpiryDays),
    }, { directPublish: publishInfo.canDirectPublish });

    // Handle images: classic multipart upload, or background-staged ids
    // (Phase 2.5 — photos already uploaded+converted while the form was filled,
    // so attaching them here is just a file move: Post Ad returns instantly).
    const stagedIds = parseStagedImages(req.body.stagedImages);
    let stagedPaths: string[] = [];
    if (files && files.length > 0) {
      await createAdImages(ad.id, files);
    } else if (stagedIds.length > 0) {
      stagedPaths = await consumeStagedImages(ad.id, userId, stagedIds, imageLimit);
    }

    if (publishInfo.canDirectPublish) {
      logReviewHistory(ad.id, 'owner_direct_publish', userId, 'user', null, 'Published live by verified business user (no editor review)')
        .catch((err) => console.error('Review history error:', err));
      // Editors still get notified so abuse of the privilege is visible
      notifyEditors({
        type: 'ad_live_posted',
        title: 'Business ad went live',
        body: `"${ad.title}" was published directly by a verified business (no review).`,
        // The ad is already approved — land editors on the Approved tab
        // filtered to it, not the (empty for this ad) default Pending tab.
        data: {
          route: `/editor/ad-management?status=approved&search=${encodeURIComponent(ad.title)}`,
          adId: String(ad.id),
        },
        referenceId: ad.id,
      }).catch((err) => console.error('Live-ad editor notification error:', err));
    }

    res.status(201).json({
      success: true,
      message: publishInfo.canDirectPublish
        ? 'Ad published successfully. It is now live.'
        : 'Ad created successfully. It will be reviewed by our team shortly.',
      data: ad,
      resultingStatus: ad.status,
    });

    // First ad seeds the shop page's Location + Categories tabs (only-if-empty)
    seedShopDefaultsFromAd(userId, ad).catch((err) =>
      console.error('Shop defaults seeding error:', err)
    );

    if (!publishInfo.canDirectPublish) {
      // AI first-pass moderation runs AFTER the response so posting stays fast
      // (same fire-and-forget pattern as the FCM notifies). It also owns the
      // editor "new ad pending" notification: held/unmoderated ads notify
      // editors exactly as before, AI-published ads notify that it went live.
      moderateNewAd({
        adId: ad.id,
        title: ad.title,
        description: ad.description,
        price: parsedPrice ?? null,
        categoryName: ad.categories?.name ?? null,
        categoryId: ad.category_id ?? null,
        ownerUserId: userId,
        imagePaths: files && files.length > 0 ? files.map((f) => f.path) : stagedPaths,
        adUpdatedAt: ad.updated_at,
      }).catch((err) => console.error('AI moderation error:', err));
    } else {
      // Verified business: published instantly, audited right after —
      // everyone is screened, trust only changes the order (owner policy).
      auditLiveAd({
        adId: ad.id,
        title: ad.title,
        description: ad.description,
        price: parsedPrice ?? null,
        categoryName: ad.categories?.name ?? null,
        categoryId: ad.category_id ?? null,
        ownerUserId: userId,
        imagePaths: files && files.length > 0 ? files.map((f) => f.path) : stagedPaths,
        adUpdatedAt: ad.updated_at,
      }).catch((err) => console.error('AI audit error:', err));
    }
  })
);

/**
 * GET /api/ads/:id/edit-context
 * Owner-only: tells the client what will happen if this ad is edited,
 * so the right warning can be shown BEFORE the edit form opens.
 */
router.get(
  '/:id/edit-context',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const existingAd = await getAdForEdit(parseInt(String(req.params.id)), userId);

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to edit it');
    }

    const [publishInfo, editsUsed] = await Promise.all([
      getDirectPublishInfo(userId),
      countLiveEditsThisMonth(existingAd.id),
    ]);

    res.json({
      success: true,
      data: {
        status: existingAd.status,
        // Seller-facing AI verdict: the post-success modal polls this endpoint
        // and flips to the hold reason. The raw ai_reason stays editor-only.
        aiHeld: existingAd.ai_verdict === 'held',
        aiReasonCode:
          existingAd.ai_verdict === 'held' ? (existingAd.ai_reason_code ?? null) : null,
        aiSuggestedCategory:
          existingAd.ai_verdict === 'held' ? (existingAd.ai_suggested_category ?? null) : null,
        canDirectPublish: publishInfo.canDirectPublish,
        // Editing an approved ad takes it offline for re-review unless the user is trusted
        willGoToPending: existingAd.status === 'approved' ? !publishInfo.canDirectPublish : true,
        editLimit: MAX_LIVE_EDITS_PER_MONTH,
        editsUsed,
        editsRemaining: Math.max(0, MAX_LIVE_EDITS_PER_MONTH - editsUsed),
      },
    });
  })
);

/**
 * GET /api/ads/:id/edit-history
 * Owner-only: this ad's edit versions (what the editor panel also sees).
 */
router.get(
  '/:id/edit-history',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const existingAd = await getAdForEdit(parseInt(String(req.params.id)), userId);

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to view its history');
    }

    const rows = await getAdEditHistoryForOwner(existingAd.id);
    res.json({ success: true, data: rows });
  })
);

/**
 * PUT /api/ads/:id
 * Update an ad (supports multipart/form-data for image uploads)
 */
router.put(
  '/:id',
  authenticateToken,
  uploadAdImages.array('images', 10),
  optimizeImage('ad'),
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { title, description, price, categoryId, subcategoryId, locationId, attributes, existingImages } = req.body;

    console.log('📥 Ad update request:', {
      adId: id,
      userId,
      files: req.files ? (req.files as Express.Multer.File[]).length : 0,
    });

    // Check ownership
    const existingAd = await getAdForEdit(parseInt(id), userId);

    if (!existingAd) {
      throw new NotFoundError('Ad not found or you do not have permission to edit it');
    }

    // Editing an approved (live) ad: trusted business users stay live,
    // everyone else goes back to pending for editor re-review.
    const editingApproved = existingAd.status === 'approved';
    const publishInfo = editingApproved ? await getDirectPublishInfo(userId) : null;
    const directPublish = publishInfo?.canDirectPublish === true;

    if (editingApproved) {
      const editsUsed = await countLiveEditsThisMonth(existingAd.id);
      if (editsUsed >= MAX_LIVE_EDITS_PER_MONTH) {
        throw new ValidationError(
          `You have reached the monthly edit limit (${MAX_LIVE_EDITS_PER_MONTH}) for this ad. You can edit it again next month.`
        );
      }
    }

    // Only when the edit actually carries a location — an omitted one leaves
    // the ad's existing location untouched and needs no re-check.
    if (locationId) {
      const locationError = await validateAdLocation(parseInt(locationId));
      if (locationError) {
        throw new ValidationError(locationError);
      }
    }

    // Parse attributes
    const parsedAttributes = parseAttributes(attributes);
    // An attributes payload that omits condition is the client clearing it —
    // categories where the policy hides Condition strip it on edit. Only a
    // request with no attributes at all leaves the stored value alone.
    const condition = attributes !== undefined
      ? ((parsedAttributes.condition as string | undefined) ?? null)
      : undefined;
    const { condition: _cond, ...customFields } = parsedAttributes;

    if (attributes !== undefined) {
      const leafCategoryId = subcategoryId
        ? parseInt(subcategoryId)
        : categoryId
          ? parseInt(categoryId)
          : existingAd.category_id;
      const conditionError = leafCategoryId
        ? await validateAdCondition(leafCategoryId, condition)
        : null;
      if (conditionError) {
        throw new ValidationError(conditionError);
      }
    }

    // Parse existing images to keep
    const imagesToKeep = parseExistingImages(existingImages);

    // Update ad
    const { ad, newStatus } = await updateAd(parseInt(id), existingAd, {
      title,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      subcategoryId: subcategoryId ? parseInt(subcategoryId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      condition,
      customFields,
    }, { directPublish });

    // Every owner edit is snapshotted (Facebook-style version history)
    recordAdEditSnapshot(existingAd, userId, newStatus)
      .catch((err) => console.error('Edit snapshot error:', err));

    if (editingApproved) {
      logReviewHistory(
        ad.id,
        directPublish ? 'owner_edit_live' : 'owner_edit_resubmit',
        userId,
        'user',
        null,
        directPublish
          ? 'Live ad edited by verified business user (stayed live)'
          : 'Live ad edited by owner — sent back to pending for re-review'
      ).catch((err) => console.error('Review history error:', err));

      notifyEditors({
        type: directPublish ? 'ad_live_edited' : 'new_ad_pending',
        title: directPublish ? 'Live ad edited by business' : 'Edited ad needs re-review',
        body: directPublish
          ? `"${ad.title}" was edited by a verified business and is still live.`
          : `"${ad.title}" was edited by its owner and went back to pending.`,
        data: {
          // Direct-published edits stay approved — send editors to the Approved
          // tab filtered to the ad; pending resubmissions keep the default tab.
          route: directPublish
            ? `/editor/ad-management?status=approved&search=${encodeURIComponent(ad.title)}`
            : '/editor/ad-management',
          adId: String(ad.id),
        },
        referenceId: ad.id,
      }).catch((err) => console.error('Edit editor notification error:', err));
    }

    // Track price changes and notify favorites on price drop
    const newPrice = price !== undefined ? parseFloat(price) : undefined;
    if (newPrice && existingAd.price && Number(existingAd.price) !== newPrice) {
      prisma.ad_price_history.create({
        data: {
          ad_id: ad.id,
          old_price: existingAd.price,
          new_price: newPrice,
        },
      }).catch(err => console.error('Price history error:', err));

      // Notify users who favorited this ad if price dropped
      if (newPrice < Number(existingAd.price)) {
        prisma.user_favorites.findMany({
          where: { ad_id: ad.id },
          select: { user_id: true },
        }).then(favUsers => {
          const recipients = favUsers.map(f => f.user_id).filter(uid => uid !== userId);
          if (recipients.length > 0) {
            sendNotification({
              recipientUserIds: recipients,
              type: 'price_drop',
              title: 'Price Drop!',
              body: `"${ad.title}": Rs. ${Number(existingAd.price).toLocaleString()} → Rs. ${newPrice.toLocaleString()}`,
              data: { adId: String(ad.id), route: '/ad' },
              referenceId: ad.id,
            }).catch(err => console.error('Price drop notification error:', err));
          }
        }).catch(() => {});
      }
    }

    // Update images
    const files = req.files as Express.Multer.File[];
    const imagesStampedAt = await updateAdImages(
      ad.id,
      existingAd.ad_images,
      imagesToKeep,
      files || []
    );
    // TOCTOU stamp for the AI check below: image changes bump updated_at, so
    // the check must compare against the FINAL post-edit value.
    const moderationSnapshotAt = imagesStampedAt ?? ad.updated_at;

    res.json({
      success: true,
      message: newStatus === 'pending'
        ? 'Ad updated and resubmitted for review'
        : editingApproved && directPublish
          ? 'Ad updated and is still live'
          : 'Ad updated successfully',
      data: ad,
      resultingStatus: newStatus,
    });

    if ((newStatus === 'pending' && !directPublish) || (directPublish && newStatus === 'approved')) {
      // Edited ads go through the SAME AI screening as new ads (owner rule:
      // a changed photo/title must never coast on an old approval). Normal
      // sellers' edits are pending and re-checked like new submissions;
      // verified-business edits stay live and are audited right after.
      // Runs post-response and fire-and-forget, exactly like the create path.
      (async () => {
        const [category, images] = await Promise.all([
          ad.category_id
            ? prisma.categories.findUnique({
                where: { id: ad.category_id },
                select: { name: true },
              })
            : Promise.resolve(null),
          prisma.ad_images.findMany({
            where: { ad_id: ad.id },
            orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
            select: { filename: true },
          }),
        ]);
        // Tell the model where this ad came from and what changed — a live
        // ad with swapped photos gets scrutiny, a typo fix gets a confident
        // publish, a rejected resubmit is judged against the editor's reason.
        const editContext = buildEditContext({
          previousStatus: existingAd.status ?? null,
          liveSince: existingAd.published_at ?? null,
          rejectionReason:
            existingAd.status === 'rejected' ? (existingAd.status_reason ?? null) : null,
          oldTitle: existingAd.title,
          newTitle: ad.title,
          oldPrice: existingAd.price ? Number(existingAd.price) : null,
          newPrice: ad.price ? Number(ad.price) : null,
          descriptionChanged: (ad.description ?? '') !== (existingAd.description ?? ''),
          categoryChanged: ad.category_id !== existingAd.category_id,
          photosKept: imagesToKeep.length,
          photosRemoved: Math.max(0, existingAd.ad_images.length - imagesToKeep.length),
          photosAdded: (req.files as Express.Multer.File[] | undefined)?.length ?? 0,
        });
        const common = {
          adId: ad.id,
          title: ad.title,
          description: ad.description,
          price: ad.price ? Number(ad.price) : null,
          categoryName: category?.name ?? null,
          categoryId: ad.category_id ?? null,
          ownerUserId: userId,
          imagePaths: images.map((img) => `uploads/ads/${img.filename}`),
          adUpdatedAt: moderationSnapshotAt,
        };
        if (directPublish) {
          // Verified business: the edit stayed live — audit it right after.
          await auditLiveAd({ ...common, editContext });
        } else {
          await moderateNewAd({
            ...common,
            edit: { firstPublishedAt: existingAd.published_at ?? null, context: editContext },
          });
        }
      })().catch((err) => console.error('AI edit re-moderation error:', err));
    }
  })
);

/**
 * DELETE /api/ads/:id
 * Delete an ad
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const deletedAd = await deleteAd(parseInt(id), userId);

    if (!deletedAd) {
      throw new NotFoundError('Ad not found or you do not have permission to delete it');
    }

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  })
);

export default router;
