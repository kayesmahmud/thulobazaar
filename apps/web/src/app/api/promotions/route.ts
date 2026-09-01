import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/promotions
 * Get user's promotion history
 *
 * Query params:
 * - limit: number (default: 50)
 * - page: number (default: 1)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const offset = (page - 1) * limit;

    // Get total count
    const total = await prisma.ad_promotions.count({
      where: { user_id: userId },
    });

    // Fetch promotions with ad details
    const promotions = await prisma.ad_promotions.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        ad_id: true,
        user_id: true,
        promotion_type: true,
        duration_days: true,
        price_paid: true,
        account_type: true,
        payment_reference: true,
        payment_method: true,
        starts_at: true,
        expires_at: true,
        is_active: true,
        created_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            status: true,
            slug: true,
            ad_images: {
              where: { is_primary: true },
              select: {
                file_path: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform to camelCase
    const transformedPromotions = promotions.map((promo) => ({
      id: promo.id,
      adId: promo.ad_id,
      userId: promo.user_id,
      promotionType: promo.promotion_type,
      durationDays: promo.duration_days,
      pricePaid: parseFloat(promo.price_paid.toString()),
      accountType: promo.account_type,
      paymentReference: promo.payment_reference,
      paymentMethod: promo.payment_method,
      startsAt: promo.starts_at,
      expiresAt: promo.expires_at,
      isActive: promo.is_active,
      createdAt: promo.created_at,
      ad: {
        id: promo.ads.id,
        title: promo.ads.title,
        status: promo.ads.status,
        slug: promo.ads.slug,
        primaryImage: promo.ads.ad_images[0]?.file_path || null,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedPromotions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promotions fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch promotions',
      },
      { status: 500 }
    );
  }
}

const VALID_PROMOTION_TYPES = ['featured', 'urgent', 'sticky'] as const;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
  }
}

function parseTxMetadata(metadata: unknown): Record<string, unknown> {
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
}

/**
 * POST /api/promotions
 * Apply an ALREADY PAID promotion to the caller's own ad.
 *
 * Body:
 * - adId: number (required)
 * - promotionType: string (required) - 'featured' | 'urgent' | 'sticky'
 * - durationDays: number (required)
 * - paymentReference: string (required) - payment_transactions.transaction_id or its numeric id
 * - paymentMethod: string (optional)
 *
 * Server-authoritative (mirrors Express POST /api/promotions): the promotion is
 * never granted on the caller's word. A payment_transactions row must exist that
 * is verified, of type ad_promotion, owned by the caller, made for this ad with
 * this type/duration, and not already consumed. Price recorded = amount paid.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const { adId, promotionType, durationDays, paymentReference, paymentMethod } = body;

    const adIdNum = parseInt(String(adId ?? ''), 10);
    const duration = parseInt(String(durationDays ?? ''), 10);
    if (!Number.isFinite(adIdNum) || !promotionType || !Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json(
        { success: false, message: 'Ad ID, promotion type, and duration are required' },
        { status: 400 }
      );
    }

    if (!VALID_PROMOTION_TYPES.includes(promotionType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid promotion type. Must be one of: ${VALID_PROMOTION_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const reference = typeof paymentReference === 'number' ? String(paymentReference) : paymentReference;
    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { success: false, message: 'A verified payment is required to promote an ad' },
        { status: 402 }
      );
    }

    // Verify ad belongs to user
    const ad = await prisma.ads.findUnique({
      where: { id: adIdNum },
      select: { id: true, user_id: true, status: true },
    });

    if (!ad) {
      return NextResponse.json({ success: false, message: 'Ad not found' }, { status: 404 });
    }

    if (ad.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'You can only promote your own ads' },
        { status: 403 }
      );
    }

    // Look the payment up by transaction_id OR numeric id (both formats are
    // used as references across the payment flows).
    const numericRef = /^\d+$/.test(reference) ? parseInt(reference, 10) : null;
    const paymentTx = await prisma.payment_transactions.findFirst({
      where: numericRef !== null
        ? { OR: [{ transaction_id: reference }, { id: numericRef }] }
        : { transaction_id: reference },
      select: {
        id: true,
        transaction_id: true,
        user_id: true,
        status: true,
        payment_type: true,
        payment_gateway: true,
        related_id: true,
        amount: true,
        metadata: true,
      },
    });

    if (
      !paymentTx ||
      paymentTx.user_id !== userId ||
      paymentTx.status !== 'verified' ||
      paymentTx.payment_type !== 'ad_promotion'
    ) {
      return NextResponse.json(
        { success: false, message: 'No verified payment found for this reference' },
        { status: 402 }
      );
    }

    if (paymentTx.payment_gateway === 'mock' && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'No verified payment found for this reference' },
        { status: 402 }
      );
    }

    if (paymentTx.related_id !== ad.id) {
      return NextResponse.json(
        { success: false, message: 'This payment was made for a different ad' },
        { status: 400 }
      );
    }

    // The payment's stored metadata (validated against pricing at initiation)
    // must match what is being requested now.
    const txMeta = parseTxMetadata(paymentTx.metadata);
    const paidType = String(txMeta.promotionType || '');
    const paidDuration = parseInt(String(txMeta.durationDays ?? ''), 10);
    if (paidType !== promotionType || paidDuration !== duration) {
      return NextResponse.json(
        { success: false, message: 'This payment does not match the requested promotion type or duration' },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { account_type: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const accountType = user.account_type || 'individual';
    const pricePaid = paymentTx.amount;

    const result = await prisma.$transaction(async (tx) => {
      // One payment -> one promotion, race-safe: lock the payment row so
      // concurrent requests serialize, then re-check consumption INSIDE the
      // transaction. References are stored as either the numeric id or the
      // transaction_id, so check both.
      await tx.$queryRaw`SELECT id FROM payment_transactions WHERE id = ${paymentTx.id} FOR UPDATE`;
      const alreadyConsumed = await tx.ad_promotions.findFirst({
        where: {
          payment_reference: { in: [paymentTx.id.toString(), paymentTx.transaction_id] },
        },
        select: { id: true },
      });
      if (alreadyConsumed) {
        throw new HttpError(409, 'This payment has already been used for a promotion');
      }

      // Existing active promotion: same type extends, a different type conflicts.
      const existingPromo = await tx.ad_promotions.findFirst({
        where: { ad_id: ad.id, is_active: true, expires_at: { gt: new Date() } },
      });
      const isExtension = !!existingPromo && existingPromo.promotion_type === promotionType;
      if (existingPromo && !isExtension) {
        const daysRemaining = Math.ceil((existingPromo.expires_at.getTime() - Date.now()) / MS_PER_DAY);
        throw new HttpError(
          409,
          `Ad already has an active ${existingPromo.promotion_type} promotion. You can only extend the same type.`,
          {
            activePromotion: {
              id: existingPromo.id,
              promotionType: existingPromo.promotion_type,
              expiresAt: existingPromo.expires_at,
              daysRemaining,
            },
          }
        );
      }

      // Extending keeps the remaining time: add days onto the current expiry.
      const baseDate = isExtension && existingPromo ? existingPromo.expires_at : new Date();
      const expiresAt = new Date(baseDate.getTime() + duration * MS_PER_DAY);

      if (isExtension && existingPromo) {
        await tx.ad_promotions.update({
          where: { id: existingPromo.id },
          data: { is_active: false },
        });
      }

      const promo = await tx.ad_promotions.create({
        data: {
          ad_id: ad.id,
          user_id: userId,
          promoted_by: userId,
          promotion_type: promotionType,
          duration_days: duration,
          price_paid: pricePaid,
          account_type: accountType,
          payment_reference: paymentTx.transaction_id,
          payment_method: paymentMethod || paymentTx.payment_gateway,
          starts_at: new Date(),
          expires_at: expiresAt,
        },
      });

      // Reset all promotion flags, then set only the new one
      const updateData: Record<string, unknown> = {
        promoted_at: new Date(),
        is_featured: false,
        featured_until: null,
        is_urgent: false,
        urgent_until: null,
        is_sticky: false,
        sticky_until: null,
      };

      if (promotionType === 'featured') {
        updateData.is_featured = true;
        updateData.featured_until = expiresAt;
      } else if (promotionType === 'urgent') {
        updateData.is_urgent = true;
        updateData.urgent_until = expiresAt;
      } else if (promotionType === 'sticky') {
        updateData.is_sticky = true;
        updateData.sticky_until = expiresAt;
      }

      await tx.ads.update({ where: { id: ad.id }, data: updateData });

      return { promo, isExtension };
    });

    const { promo, isExtension } = result;

    console.log(
      `✅ Ad ${ad.id} promotion ${isExtension ? 'extended' : 'created'}: ${promotionType} for ${duration} days by user ${userId} (payment ${paymentTx.transaction_id})`
    );

    return NextResponse.json(
      {
        success: true,
        message: isExtension ? `Promotion extended by ${duration} days` : 'Ad promoted successfully',
        data: {
          id: promo.id,
          adId: promo.ad_id,
          promotionType: promo.promotion_type,
          durationDays: promo.duration_days,
          pricePaid: parseFloat(promo.price_paid.toString()),
          expiresAt: promo.expires_at,
          createdAt: promo.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { success: false, message: error.message, ...(error.data ? { data: error.data } : {}) },
        { status: error.status }
      );
    }

    console.error('Promotion creation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to promote ad' },
      { status: 500 }
    );
  }
}
