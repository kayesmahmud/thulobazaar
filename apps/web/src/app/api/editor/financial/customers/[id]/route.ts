import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import {
  businessBadgeState,
  individualBadgeState,
  isExpired,
  snapshotBadgeState,
  SUPERSEDED_BADGE,
} from '@/lib/financial/badge';
import { getExcludedUserIds } from '@/lib/financial/exclusions';

/**
 * GET /api/editor/financial/customers/[id]
 * One customer's complete purchase history: every payment, every promotion
 * (with its expiry), and every badge grant.
 *
 * Sourced from the purchase_history ledger, so the history survives the ad
 * being deleted (ad_promotions cascades) and even the account being deleted
 * (everything else cascades). The live tables refine what they still know:
 * identity, the promotion's is_active/expires_at, the badge's current state,
 * and the pending/failed checkouts that never reach the ledger.
 *
 * Expired, superseded and orphaned purchases are included and labelled, never
 * hidden — this is the "we don't know who bought what" answer.
 */

interface LedgerRow {
  id: number;
  event: string;
  kind: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  shop_slug: string | null;
  ad_id: number | null;
  ad_title: string | null;
  promotion_type: string | null;
  duration_days: number | null;
  label: string | null;
  amount: unknown;
  payment_status: string;
  payment_gateway: string | null;
  payment_transaction_id: number | null;
  occurred_at: Date;
  expires_at: Date | null;
  // live joins
  live_ad_title: string | null;
  ad_deleted: boolean;
  promo_live: boolean;
  is_active: boolean | null;
  live_starts_at: Date | null;
  live_expires_at: Date | null;
  transaction_id: string | null;
  txn_created_at: Date | null;
  /** payment event whose transaction some ad_promotion grant references */
  provisioned: boolean;
}

type PromotionStatus = 'active' | 'ended' | 'expired' | 'removed' | 'unknown';

/**
 * Same rule as /api/editor/financial/promotions.
 * Live ad_promotions row: expired once its clock ran out whatever is_active says
 * (the deactivation cron lags); otherwise is_active decides — extending a running
 * promotion flips the OLD row to is_active=false while its expires_at is still in
 * the future, i.e. 'ended'. No live row: the snapshot expiry can still prove it
 * expired; else the entitlement went with the ad ('removed'), or we cannot tell.
 * A payment nothing ever provisioned is always 'unknown'.
 */
function promotionStatus(r: LedgerRow, now: number): PromotionStatus {
  if (r.event === 'payment') return 'unknown';
  if (r.promo_live) {
    if (isExpired(r.live_expires_at, now)) return 'expired';
    return r.is_active === true ? 'active' : 'ended';
  }
  if (isExpired(r.expires_at, now)) return 'expired';
  return r.ad_deleted ? 'removed' : 'unknown';
}

const isPromotion = (r: LedgerRow) => r.kind === 'ad_promotion';
const isVerificationGrant = (r: LedgerRow) => r.event === 'grant' && r.kind.endsWith('_verification');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid customer id' }, { status: 400 });
    }

    const [user, ledger, excluded] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          created_at: true,
          account_type: true,
          business_name: true,
          business_verification_status: true,
          business_verified_at: true,
          business_verification_expires_at: true,
          individual_verified: true,
          individual_verified_at: true,
          individual_verification_expires_at: true,
          shop_slug: true,
          custom_shop_slug: true,
        },
      }),
      // Newest first; the first row is therefore the latest identity snapshot.
      // adDeleted also covers soft-deleted ads (deleted_at / status), which keep
      // their ad_promotions rows.
      prisma.$queryRaw<LedgerRow[]>`
        SELECT h.id, h.event, h.kind,
               h.user_name, h.user_phone, h.user_email, h.shop_slug,
               h.ad_id, h.ad_title, h.promotion_type, h.duration_days, h.label,
               h.amount, h.payment_status, h.payment_gateway, h.payment_transaction_id,
               h.occurred_at, h.expires_at,
               a.title AS live_ad_title,
               (a.id IS NULL OR a.deleted_at IS NOT NULL OR COALESCE(a.status, '') = 'deleted') AS ad_deleted,
               (p.id IS NOT NULL) AS promo_live,
               p.is_active, p.starts_at AS live_starts_at, p.expires_at AS live_expires_at,
               t.transaction_id, t.created_at AS txn_created_at,
               (h.event = 'payment' AND EXISTS (
                  SELECT 1 FROM purchase_history g
                  WHERE g.event = 'grant' AND g.kind = 'ad_promotion'
                    AND g.payment_transaction_id = h.payment_transaction_id
               )) AS provisioned
        FROM purchase_history h
        LEFT JOIN ads a ON a.id = h.ad_id
        LEFT JOIN ad_promotions p ON h.source_table = 'ad_promotions' AND p.id = h.source_id
        LEFT JOIN payment_transactions t ON t.id = h.payment_transaction_id
        WHERE h.user_id = ${userId}
        ORDER BY h.occurred_at DESC, h.id DESC
      `,
      getExcludedUserIds(),
    ]);

    if (!user && ledger.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    // Abandoned (pending or canceled) and failed checkouts never reach the ledger;
    // they only exist while the user does (payment_transactions cascades on user delete).
    const liveUnpaid = user
      ? await prisma.payment_transactions.findMany({
          where: { user_id: userId, status: { in: ['pending', 'failed', 'canceled'] } },
          orderBy: { created_at: 'desc' },
          select: {
            id: true, payment_type: true, payment_gateway: true, amount: true,
            transaction_id: true, status: true, created_at: true, failure_reason: true,
          },
        })
      : [];

    const now = Date.now();
    const accountDeleted = !user;
    const latest = ledger[0];
    const latestBusinessGrant = ledger.find(r => isVerificationGrant(r) && r.kind === 'business_verification');

    const customer = user
      ? {
          id: user.id,
          fullName: user.full_name || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          accountType: user.account_type || '',
          businessName: user.business_name || '',
          joinedAt: user.created_at?.toISOString() ?? null,
          shopSlug: user.custom_shop_slug || user.shop_slug || null,
        }
      : {
          id: userId,
          fullName: latest?.user_name || 'Unknown',
          email: latest?.user_email || '',
          phone: latest?.user_phone || '',
          accountType: '',
          businessName: latestBusinessGrant?.label || '',
          joinedAt: null,
          shopSlug: latest?.shop_slug || null,
        };

    // Money truth = payment events. Entitlement truth = grant events.
    const paymentEvents = ledger.filter(r => r.event === 'payment');
    const totalSpent = paymentEvents.reduce((sum, r) => sum + Number(r.amount), 0);

    // Promotions: every grant, plus any payment that no grant ever consumed
    // (paid but never provisioned) so the money is still accounted for.
    const promotions = ledger
      .filter(r => isPromotion(r) && (r.event === 'grant' || !r.provisioned))
      .map(r => {
        const paymentStatus = r.event === 'payment' ? 'paid' : r.payment_status;
        const adTitle = r.live_ad_title || r.ad_title || (r.ad_deleted ? '(ad deleted)' : `Ad #${r.ad_id}`);
        return {
          id: `h-${r.id}`,
          adId: r.ad_id,
          adTitle,
          adDeleted: r.ad_deleted,
          type: r.promotion_type || 'unknown',
          durationDays: r.duration_days,
          pricePaid: Number(r.amount),
          paymentStatus,
          // A staff-granted comp, not a sale (the trigger classifies price 0 as comped).
          comped: paymentStatus === 'comped',
          purchasedAt: r.occurred_at.toISOString(),
          startsAt: r.live_starts_at?.toISOString() ?? null,
          expiresAt: (r.promo_live ? r.live_expires_at : r.expires_at)?.toISOString() ?? null,
          status: promotionStatus(r, now),
        };
      });

    // Badge grants: the ledger is already newest-first, so the first grant of a
    // kind is the one the live users.* columns describe; older ones are superseded.
    // With the account gone, the grant-time snapshot expiry is all that is known.
    const seenKinds = new Set<string>();
    const verifications = ledger.filter(isVerificationGrant).map(r => {
      const type = r.kind.replace('_verification', '') as 'business' | 'individual';
      const newest = !seenKinds.has(r.kind);
      seenKinds.add(r.kind);
      const badge = !newest
        ? SUPERSEDED_BADGE
        : !user
          ? snapshotBadgeState(r.expires_at, now)
          : type === 'business'
            ? businessBadgeState(user.business_verification_status, user.business_verification_expires_at, now)
            : individualBadgeState(user.individual_verified, user.individual_verification_expires_at, now);
      return {
        id: `h-${r.id}`,
        type,
        label: r.label || '',
        verifiedAt: r.occurred_at.toISOString(),
        superseded: !newest,
        ...badge,
        amount: Number(r.amount),
        paymentStatus: r.payment_status,
        durationDays: r.duration_days,
      };
    });

    const payments = [
      ...paymentEvents.map(r => ({
        id: `h-${r.id}`,
        type: r.kind,
        gateway: r.payment_gateway,
        amount: Number(r.amount),
        transactionId: r.transaction_id,
        status: 'verified',
        createdAt: (r.txn_created_at ?? r.occurred_at).toISOString(),
        verifiedAt: r.occurred_at.toISOString(),
        failureReason: null as string | null,
      })),
      ...liveUnpaid.map(t => ({
        id: `t-${t.id}`,
        type: t.payment_type,
        gateway: t.payment_gateway,
        amount: Number(t.amount),
        transactionId: t.transaction_id,
        status: t.status || 'pending',
        createdAt: t.created_at?.toISOString() ?? null,
        verifiedAt: null as string | null,
        failureReason: t.failure_reason,
      })),
    ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return NextResponse.json({
      success: true,
      data: {
        customer,
        accountDeleted,
        // Test/demo account: still fully inspectable, just kept out of the totals.
        excludedFromReports: excluded.includes(userId),
        summary: {
          totalSpent,
          totalPurchases: paymentEvents.length,
          abandonedCheckouts: liveUnpaid.filter(t => t.status !== 'failed').length,
          failedPayments: liveUnpaid.filter(t => t.status === 'failed').length,
        },
        badges: {
          business: {
            status: user?.business_verification_status || 'none',
            verifiedAt: user?.business_verified_at?.toISOString() ?? null,
            expiresAt: user?.business_verification_expires_at?.toISOString() ?? null,
            expired: isExpired(user?.business_verification_expires_at, now),
          },
          individual: {
            verified: !!user?.individual_verified,
            verifiedAt: user?.individual_verified_at?.toISOString() ?? null,
            expiresAt: user?.individual_verification_expires_at?.toISOString() ?? null,
            expired: isExpired(user?.individual_verification_expires_at, now),
          },
        },
        promotions,
        verifications,
        payments,
      },
    });
  } catch (error: any) {
    console.error('Financial customer detail error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch customer' }, { status: 500 });
  }
}
