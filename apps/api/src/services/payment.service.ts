/**
 * Payment Service
 * Handles payment initiation, verification, and success processing
 */

import { prisma } from '@thulobazaar/database';
import { initiatePayment, verifyPayment, getAvailableGateways, decodeEsewaCallback } from '../lib/payment/index.js';
import type { PaymentGateway, PaymentType } from '../lib/payment/types.js';
import { sendNotification } from './notification.service.js';

// ============================================================================
// Types
// ============================================================================

export interface InitiatePaymentInput {
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  paymentType: PaymentType;
  relatedId?: number;
  orderName?: string;
  metadata?: Record<string, unknown>;
  customReturnUrl?: string;
}

export interface VerifyPaymentInput {
  transactionId: string;
  pidx?: string;
  esewaData?: string;
}

export interface PaymentTransaction {
  id: number;
  user_id: number;
  payment_type: string;
  payment_gateway: string | null;
  amount: unknown;
  metadata: unknown;
  transaction_id: string | null;
  related_id: number | null;
  status: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

function generateOrderId(paymentType: PaymentType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TB_${paymentType.toUpperCase().slice(0, 3)}_${timestamp}_${random}`;
}

function buildReturnUrl(
  baseUrl: string,
  gateway: PaymentGateway,
  orderId: string,
  paymentType: PaymentType,
  relatedId?: number,
  customReturnUrl?: string
): string {
  if (customReturnUrl) return customReturnUrl;

  let returnUrl = `${baseUrl}/api/payments/callback?gateway=${gateway}&orderId=${orderId}&paymentType=${paymentType}`;
  if (relatedId) {
    returnUrl += `&relatedId=${relatedId}`;
  }
  return returnUrl;
}

function parseMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata as Record<string, unknown>;
}

// ============================================================================
// 🔒 PAY-4: Server-side authoritative pricing
// The client's `amount`/`metadata` are NEVER trusted. At initiation we compute
// the expected price from promotion_pricing / verification_pricing and reject
// any amount below it. Mirrors the exact client formula (web
// usePromotionPricing.calculatePrice + mobile promote_ad_screen):
//   round(individualBasePrice × (1 − min(accountDiscount + campaignDiscount, 90)/100))
// ============================================================================

/** Tolerance for client integer rounding of Decimal prices (NPR). */
const AMOUNT_TOLERANCE_NPR = 1;

async function resolveEffectiveAccountDiscount(userId: number): Promise<number> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { account_type: true, business_verification_status: true, individual_verified: true },
  });
  if (!user) return 0;
  if (user.account_type === 'business' && user.business_verification_status === 'approved') return 40;
  if (
    user.account_type === 'individual' &&
    (user.individual_verified || user.business_verification_status === 'verified')
  ) {
    return 20;
  }
  return 0;
}

async function resolveAdPricingTier(adId: number): Promise<string> {
  const ad = await prisma.ads.findUnique({
    where: { id: adId },
    select: {
      categories: {
        select: { id: true, categories: { select: { id: true } } },
      },
    },
  });
  if (!ad?.categories) return 'default';
  const parentCategoryId = ad.categories.categories?.id || ad.categories.id;
  const tierMapping = await prisma.category_pricing_tiers.findFirst({
    where: { category_id: parentCategoryId },
    select: { pricing_tier: true },
  });
  return tierMapping?.pricing_tier || 'default';
}

/**
 * Best currently-active campaign discount for a tier. Deliberately permissive
 * (tier + max-uses filters only, like the clients apply it) — this feeds a price
 * FLOOR, so a lower floor can only cause acceptance of a legitimately
 * discounted price, never a bypass above it.
 */
async function bestActiveCampaignDiscount(tier: string): Promise<number> {
  const now = new Date();
  const campaigns = await prisma.promotional_campaigns.findMany({
    where: { is_active: true, start_date: { lte: now }, end_date: { gte: now } },
    select: { discount_percentage: true, applies_to_tiers: true, max_uses: true, current_uses: true },
    orderBy: { discount_percentage: 'desc' },
  });
  const best = campaigns.find((c) => {
    if (c.applies_to_tiers && c.applies_to_tiers.length > 0 && !c.applies_to_tiers.includes(tier)) return false;
    if (c.max_uses && c.current_uses && c.current_uses >= c.max_uses) return false;
    return true;
  });
  return best?.discount_percentage || 0;
}

export type AmountValidation = { ok: boolean; expected?: number; error?: string };

export async function getAuthoritativeAmount(input: {
  userId: number;
  paymentType: PaymentType;
  relatedId?: number;
  metadata?: Record<string, unknown>;
}): Promise<AmountValidation> {
  const { userId, paymentType, relatedId, metadata } = input;

  if (paymentType === 'ad_promotion') {
    const promotionType = String(metadata?.promotionType || '');
    const durationDays = parseInt(String(metadata?.durationDays ?? ''), 10);
    if (!relatedId || !promotionType || !Number.isFinite(durationDays)) {
      return { ok: false, error: 'Promotion payments require relatedId (adId), promotionType, and durationDays' };
    }

    const ad = await prisma.ads.findUnique({ where: { id: relatedId }, select: { id: true } });
    if (!ad) return { ok: false, error: 'Ad not found' };

    const tier = await resolveAdPricingTier(relatedId);
    let base = await prisma.promotion_pricing.findFirst({
      where: {
        promotion_type: promotionType,
        duration_days: durationDays,
        account_type: 'individual',
        pricing_tier: tier,
        is_active: true,
      },
      select: { price: true },
    });
    if (!base && tier !== 'default') {
      base = await prisma.promotion_pricing.findFirst({
        where: {
          promotion_type: promotionType,
          duration_days: durationDays,
          account_type: 'individual',
          pricing_tier: 'default',
          is_active: true,
        },
        select: { price: true },
      });
    }
    if (!base) return { ok: false, error: 'No active pricing found for the selected promotion' };

    const accountDiscount = await resolveEffectiveAccountDiscount(userId);
    const campaignDiscount = await bestActiveCampaignDiscount(tier);
    const totalDiscount = Math.min(accountDiscount + campaignDiscount, 90);
    const expected = Math.round(parseFloat(base.price.toString()) * (1 - totalDiscount / 100));
    return { ok: true, expected };
  }

  if (paymentType === 'individual_verification' || paymentType === 'business_verification') {
    const vType = paymentType === 'business_verification' ? 'business' : 'individual';
    if (!relatedId) return { ok: false, error: 'Verification payments require relatedId (verification request id)' };

    // Anchor to the verification request's own duration (server-side record).
    const request =
      vType === 'business'
        ? await prisma.business_verification_requests.findUnique({
            where: { id: relatedId },
            select: { user_id: true, duration_days: true },
          })
        : await prisma.individual_verification_requests.findUnique({
            where: { id: relatedId },
            select: { user_id: true, duration_days: true },
          });
    if (!request) return { ok: false, error: 'Verification request not found' };
    if (request.user_id !== userId) return { ok: false, error: 'Verification request belongs to another user' };

    const pricing = await prisma.verification_pricing.findFirst({
      where: {
        verification_type: vType,
        duration_days: request.duration_days || 365,
        is_active: true,
      },
      select: { price: true },
    });
    if (!pricing) return { ok: false, error: 'No active pricing found for this verification' };
    return { ok: true, expected: parseFloat(pricing.price.toString()) };
  }

  return { ok: false, error: 'Unknown payment type' };
}

// ============================================================================
// Payment Initiation
// ============================================================================

export async function initiatePaymentTransaction(input: InitiatePaymentInput) {
  const {
    userId,
    gateway,
    amount,
    paymentType,
    relatedId,
    orderName,
    metadata,
    customReturnUrl,
  } = input;

  // 🔒 PAY-4: never trust the client's amount — compute the authoritative price
  // server-side and reject anything below it (pay-10-get-2000 exploit).
  const priceCheck = await getAuthoritativeAmount({ userId, paymentType, relatedId, metadata });
  if (!priceCheck.ok || priceCheck.expected === undefined) {
    return { success: false, error: priceCheck.error || 'Unable to validate payment amount' };
  }
  if (amount < priceCheck.expected - AMOUNT_TOLERANCE_NPR) {
    console.warn(
      `🚫 Payment amount below authoritative price: got NPR ${amount}, expected NPR ${priceCheck.expected} (user ${userId}, ${paymentType})`
    );
    return { success: false, error: 'Payment amount does not match the current price. Please refresh and try again.' };
  }
  // 🔒 The client's amount only had to clear the floor — what we STORE and
  // CHARGE is the server-authoritative price, so stored amount, gateway charge,
  // and verify-time reconciliation all reference the same trusted value.
  const chargedAmount = priceCheck.expected;

  const orderId = generateOrderId(paymentType);
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  const returnUrl = buildReturnUrl(baseUrl, gateway, orderId, paymentType, relatedId, customReturnUrl);

  // Get user info for payment
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { full_name: true, email: true, phone: true },
  });

  // Create payment transaction record
  const transaction = await prisma.payment_transactions.create({
    data: {
      user_id: userId,
      payment_type: paymentType,
      payment_gateway: gateway,
      amount: chargedAmount,
      transaction_id: orderId,
      related_id: relatedId || null,
      status: 'pending',
      metadata: JSON.stringify({
        ...metadata,
        orderName: orderName || `Thulo Bazaar ${paymentType.replace('_', ' ')}`,
        initiatedAt: new Date().toISOString(),
      }),
    },
  });

  // Initiate payment with gateway
  const result = await initiatePayment({
    gateway,
    amount: chargedAmount,
    paymentType,
    orderId,
    orderName: orderName || `Thulo Bazaar ${paymentType.replace('_', ' ')}`,
    userId,
    returnUrl,
    metadata: {
      ...metadata,
      userName: user?.full_name || 'Customer',
      userEmail: user?.email || '',
      userPhone: user?.phone || '',
      transactionDbId: transaction.id,
    },
  });

  if (!result.success) {
    // Update transaction as failed
    await prisma.payment_transactions.update({
      where: { id: transaction.id },
      data: {
        status: 'failed',
        failure_reason: result.error,
      },
    });

    return { success: false, error: result.error };
  }

  // Update transaction with gateway response
  await prisma.payment_transactions.update({
    where: { id: transaction.id },
    data: {
      payment_url: result.paymentUrl,
      metadata: JSON.stringify({
        ...parseMetadata(transaction.metadata),
        pidx: result.pidx,
        expiresAt: result.expiresAt,
      }),
    },
  });

  console.log(`✅ Payment initiated: ${orderId} via ${gateway}, amount: NPR ${chargedAmount}`);

  return {
    success: true,
    data: {
      transactionId: orderId,
      paymentUrl: result.paymentUrl,
      gateway,
      amount: chargedAmount,
      pidx: result.pidx,
      expiresAt: result.expiresAt,
    },
  };
}

// ============================================================================
// Payment Verification
// ============================================================================

export async function verifyGatewayPayment(
  transaction: PaymentTransaction,
  gateway: PaymentGateway,
  pidx?: string,
  esewaData?: string
) {
  let verifyResult;
  let parsedEsewaData: Record<string, unknown> | null = null;

  if (gateway === 'khalti') {
    // 🔒 PAY-1: prefer the pidx we stored at initiation over a client-supplied one,
    // so a callback can't substitute the pidx of a different (cheaper) payment.
    const storedPidx = parseMetadata(transaction.metadata).pidx as string | undefined;
    const transactionPidx = storedPidx || pidx;

    verifyResult = await verifyPayment({
      gateway: 'khalti',
      transactionId: transaction.transaction_id || '',
      pidx: transactionPidx,
      amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
    });
  } else if (gateway === 'esewa') {
    // 🔒 PAY-1: the base64 callback payload is CLIENT-CONTROLLED and unsigned in
    // practice (decodeEsewaCallback only JSON-parses it) — a forged
    // {"status":"COMPLETE"} must never mark a transaction paid. Decode it for
    // logging only; ALWAYS confirm via eSewa's server-to-server status-check API,
    // queried with OUR stored orderId + amount.
    if (esewaData) {
      parsedEsewaData = decodeEsewaCallback(esewaData);
    }

    verifyResult = await verifyPayment({
      gateway: 'esewa',
      transactionId: transaction.transaction_id || '',
      amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
    });
  } else {
    return { success: false, error: `Unknown gateway: ${gateway}` };
  }

  return { ...verifyResult, parsedEsewaData };
}

export async function updateTransactionStatus(
  transactionId: number,
  verifyResult: any,
  originalMetadata: unknown,
  expectedAmount: number,
  additionalData?: Record<string, unknown>
) {
  if (verifyResult.success && verifyResult.status === 'completed') {
    // 🔒 PAY-4: reconcile the amount the GATEWAY says was paid against the amount
    // stored at initiation. A completed-but-smaller payment must never verify a
    // larger transaction (fail closed — also rejects gateway responses that omit
    // the amount entirely).
    const gatewayAmount = Number(verifyResult.amount);
    if (!Number.isFinite(gatewayAmount) || Math.abs(gatewayAmount - expectedAmount) > AMOUNT_TOLERANCE_NPR) {
      console.error(
        `🚫 Payment amount mismatch on tx ${transactionId}: gateway says NPR ${verifyResult.amount}, expected NPR ${expectedAmount}`
      );
      await prisma.payment_transactions.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          failure_reason: `Amount mismatch: gateway reported ${verifyResult.amount}, expected ${expectedAmount}`,
        },
      });
      return false;
    }

    await prisma.payment_transactions.update({
      where: { id: transactionId },
      data: {
        status: 'verified',
        verified_at: new Date(),
        reference_id: verifyResult.gatewayTransactionId || null,
        metadata: JSON.stringify({
          ...parseMetadata(originalMetadata),
          verifiedAt: new Date().toISOString(),
          gatewayResponse: verifyResult,
          ...additionalData,
        }),
      },
    });
    return true;
  }

  await prisma.payment_transactions.update({
    where: { id: transactionId },
    data: {
      status: verifyResult.status === 'pending' ? 'pending' : 'failed',
      failure_reason: verifyResult.error || `Payment ${verifyResult.status}`,
    },
  });
  return false;
}

// ============================================================================
// Payment Success Handlers
// ============================================================================

export async function handlePaymentSuccess(
  transaction: { id: number; user_id: number; payment_type: string; amount: unknown; metadata: unknown; transaction_id: string | null },
  paymentType: PaymentType,
  relatedId: number | null
) {
  try {
    const metadata = parseMetadata(transaction.metadata);

    switch (paymentType) {
      case 'ad_promotion':
        await handleAdPromotionSuccess(transaction, metadata, relatedId);
        break;

      case 'individual_verification':
        await handleIndividualVerificationSuccess(transaction, relatedId);
        break;

      case 'business_verification':
        await handleBusinessVerificationSuccess(transaction, relatedId);
        break;
    }

    // Notify user of successful payment
    const paymentLabel = paymentType.replace(/_/g, ' ');
    sendNotification({
      recipientUserIds: [transaction.user_id],
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      body: `Payment of Rs. ${transaction.amount} confirmed for ${paymentLabel}`,
      data: {
        route: paymentType === 'ad_promotion' ? '/promotion' : '/verification',
        paymentType,
      },
    }).catch((err) => console.error('Notification error:', err));
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handleAdPromotionSuccess(
  transaction: { id: number; user_id: number; amount: unknown },
  metadata: Record<string, unknown>,
  relatedId: number | null
) {
  if (!relatedId) {
    console.error('Ad promotion payment missing relatedId (adId)');
    return;
  }

  const { promotionType, durationDays } = metadata;
  if (!promotionType || !durationDays) {
    console.error('Ad promotion payment missing metadata');
    return;
  }

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(String(durationDays), 10));

  // Get user account type for pricing record
  const user = await prisma.users.findUnique({
    where: { id: transaction.user_id },
    select: { account_type: true, business_verification_status: true, individual_verified: true },
  });

  let accountType = 'individual';
  if (user?.business_verification_status === 'approved') {
    accountType = 'business';
  } else if (user?.individual_verified) {
    accountType = 'individual_verified';
  }

  // Get the ad to find its owner
  const ad = await prisma.ads.findUnique({
    where: { id: relatedId },
    select: { user_id: true },
  });

  const adOwnerId = ad?.user_id ?? transaction.user_id;

  // Deactivate existing promotions
  await prisma.ad_promotions.updateMany({
    where: { ad_id: relatedId, is_active: true },
    data: { is_active: false },
  });

  // Create promotion record
  await prisma.ad_promotions.create({
    data: {
      ad_id: relatedId,
      user_id: adOwnerId,
      promoted_by: transaction.user_id,
      promotion_type: String(promotionType),
      duration_days: parseInt(String(durationDays), 10),
      price_paid: transaction.amount as number,
      account_type: accountType,
      payment_reference: transaction.id.toString(),
      payment_method: 'online',
      starts_at: new Date(),
      expires_at: expiresAt,
      is_active: true,
    },
  });

  // Log if someone else promoted this ad
  if (transaction.user_id !== adOwnerId) {
    console.log(`🎁 User ${transaction.user_id} promoted ad ${relatedId} owned by user ${adOwnerId}`);
  }

  // Update ad with promotion flags
  const updateData: Record<string, unknown> = {
    promoted_at: new Date(),
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

  await prisma.ads.update({
    where: { id: relatedId },
    data: updateData,
  });

  console.log(`✅ Ad ${relatedId} promoted as ${promotionType} until ${expiresAt.toISOString()}`);
}

async function handleIndividualVerificationSuccess(
  transaction: { transaction_id: string | null; user_id: number; amount: unknown },
  relatedId: number | null
) {
  if (!relatedId) {
    console.error('Individual verification payment missing relatedId (verificationRequestId)');
    return;
  }

  await prisma.individual_verification_requests.update({
    where: { id: relatedId },
    data: {
      status: 'pending',
      payment_status: 'paid',
      payment_amount: Number(transaction.amount),
      payment_reference: transaction.transaction_id || '',
    },
  });

  console.log(`✅ Individual verification ${relatedId} activated after payment for user ${transaction.user_id}`);
}

async function handleBusinessVerificationSuccess(
  transaction: { transaction_id: string | null; user_id: number; amount: unknown },
  relatedId: number | null
) {
  if (!relatedId) {
    console.error('Business verification payment missing relatedId (verificationRequestId)');
    return;
  }

  await prisma.business_verification_requests.update({
    where: { id: relatedId },
    data: {
      status: 'pending',
      payment_status: 'paid',
      payment_amount: Number(transaction.amount),
      payment_reference: transaction.transaction_id || '',
    },
  });

  console.log(`✅ Business verification ${relatedId} activated after payment for user ${transaction.user_id}`);
}

// ============================================================================
// Transaction Queries
// ============================================================================

export async function findTransactionByOrderId(orderId: string) {
  return prisma.payment_transactions.findFirst({
    where: { transaction_id: orderId },
    select: {
      id: true,
      user_id: true,
      payment_type: true,
      amount: true,
      metadata: true,
      transaction_id: true,
      related_id: true, // 🔒 PAY-1: success actions bind to the STORED target, not query params
      status: true,
    },
  });
}

export async function findTransactionWithStatus(transactionId: string) {
  return prisma.payment_transactions.findFirst({
    where: { transaction_id: transactionId },
    select: {
      id: true,
      user_id: true,
      payment_type: true,
      payment_gateway: true,
      amount: true,
      metadata: true,
      transaction_id: true,
      related_id: true,
      status: true,
    },
  });
}

export async function getTransactionStatus(transactionId: string, userId: number) {
  return prisma.payment_transactions.findFirst({
    where: {
      transaction_id: transactionId,
      user_id: userId,
    },
    select: {
      id: true,
      transaction_id: true,
      payment_type: true,
      payment_gateway: true,
      amount: true,
      status: true,
      payment_url: true,
      reference_id: true,
      created_at: true,
      verified_at: true,
      failure_reason: true,
    },
  });
}

export async function getPaymentHistory(
  userId: number,
  options: { page?: number; limit?: number; status?: string; type?: string }
) {
  const pageNum = options.page || 1;
  const limitNum = Math.min(options.limit || 10, 50);
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { user_id: userId };
  if (options.status) where.status = options.status;
  if (options.type) where.payment_type = options.type;

  const [transactions, total] = await Promise.all([
    prisma.payment_transactions.findMany({
      where,
      select: {
        id: true,
        transaction_id: true,
        payment_type: true,
        payment_gateway: true,
        amount: true,
        status: true,
        reference_id: true,
        created_at: true,
        verified_at: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.payment_transactions.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

export async function markTransactionCanceled(transactionId: number, reason: string) {
  await prisma.payment_transactions.update({
    where: { id: transactionId },
    data: { status: 'canceled', failure_reason: reason },
  });
}
