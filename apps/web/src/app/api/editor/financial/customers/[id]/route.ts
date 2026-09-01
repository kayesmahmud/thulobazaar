import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';

/**
 * GET /api/editor/financial/customers/[id]
 * One customer's complete purchase history: every payment, every promotion
 * (with its expiry), and both verification badges.
 *
 * This is the "we don't know who bought what" answer — expired purchases are
 * included and labelled, never hidden.
 */

const isExpired = (until: Date | null | undefined): boolean =>
  !!until && until.getTime() <= Date.now();

/**
 * Mirrors /api/editor/financial/promotions: a promotion whose clock ran out is
 * expired whatever is_active says (the deactivation cron lags); otherwise
 * is_active decides — extending a running promotion flips the OLD row to
 * is_active=false while its expires_at is still in the future, i.e. 'ended'.
 */
const promotionStatus = (isActive: boolean | null, expiresAt: Date): 'active' | 'ended' | 'expired' =>
  isExpired(expiresAt) ? 'expired' : isActive ? 'active' : 'ended';

/**
 * Current-badge state, same rule as /api/editor/financial/verifications:
 *   live                       -> 'approved'
 *   not live, expiry in past   -> 'expired'  (verificationCleanup.ts keeps the expiry)
 *   not live, expiry NULL/future -> 'revoked' (revoke route nulls it; the Express
 *                                 reject path drops the flag but leaves the date)
 */
const badgeState = (live: boolean, expiresAt: Date | null): 'approved' | 'expired' | 'revoked' =>
  live ? 'approved' : isExpired(expiresAt) ? 'expired' : 'revoked';

/** 'verified' is a legacy status value nothing writes any more but readers honour. */
const BUSINESS_LIVE_STATUSES = ['approved', 'verified'];

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

    const user = await prisma.users.findUnique({
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
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const [payments, promotions, businessVerifications, individualVerifications, excluded] = await Promise.all([
      prisma.payment_transactions.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true, payment_type: true, payment_gateway: true, amount: true,
          transaction_id: true, status: true, created_at: true, verified_at: true,
          failure_reason: true,
        },
      }),
      prisma.ad_promotions.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true, ad_id: true, promotion_type: true, duration_days: true,
          price_paid: true, payment_method: true,
          starts_at: true, expires_at: true, is_active: true, created_at: true,
          ads: { select: { title: true, slug: true } },
        },
      }),
      // Full badge history: one row per approved request, so renewals show up
      // as separate grants instead of collapsing into the single users.* flag.
      prisma.business_verification_requests.findMany({
        where: { user_id: userId, status: 'approved', reviewed_at: { not: null } },
        orderBy: { reviewed_at: 'desc' },
        select: {
          id: true, business_name: true, reviewed_at: true,
          payment_amount: true, payment_status: true, duration_days: true,
        },
      }),
      prisma.individual_verification_requests.findMany({
        where: { user_id: userId, status: 'approved', reviewed_at: { not: null } },
        orderBy: { reviewed_at: 'desc' },
        select: {
          id: true, full_name: true, reviewed_at: true,
          payment_amount: true, payment_status: true, duration_days: true,
        },
      }),
      getExcludedUserIds(),
    ]);

    // Money actually received, by type. `pending` rows are abandoned checkouts.
    const verified = payments.filter(p => p.status === 'verified');
    const totalSpent = verified.reduce((sum, p) => sum + Number(p.amount), 0);

    // Expiry truth (matches /api/editor/financial/verifications): users.* is
    // authoritative for the CURRENT badge — it captures manual extensions that
    // duration_days never records — but only describes the LATEST grant. Both
    // lists are already ordered reviewed_at desc, so index 0 is the live grant;
    // older ones are superseded and assert no status. The request tables never
    // learn about revocation, so `revoked` also comes from users.* (badgeState).
    // Most grants were free (amount 0) — that is the norm here, not missing data.
    const businessBadge = badgeState(
      BUSINESS_LIVE_STATUSES.includes(user.business_verification_status || ''),
      user.business_verification_expires_at
    );
    const individualBadge = badgeState(
      !!user.individual_verified,
      user.individual_verification_expires_at
    );

    const badgeFields = (newest: boolean, state: 'approved' | 'expired' | 'revoked', expiresAt: Date | null) => {
      const revoked = newest && state === 'revoked';
      return {
        superseded: !newest,
        revoked,
        // A revoked badge has no meaningful expiry (a leftover future date from
        // the reject path would otherwise read as "Active").
        expiresAt: newest && !revoked ? (expiresAt?.toISOString() ?? null) : null,
        expired: newest && !revoked && isExpired(expiresAt),
      };
    };

    const verifications = [
      ...businessVerifications.map((v, i) => ({
        id: `business-${v.id}`,
        type: 'business' as const,
        label: v.business_name || '',
        verifiedAt: v.reviewed_at?.toISOString() ?? null,
        ...badgeFields(i === 0, businessBadge, user.business_verification_expires_at),
        amount: Number(v.payment_amount ?? 0),
        paymentStatus: v.payment_status ?? 'unknown',
        durationDays: v.duration_days,
      })),
      ...individualVerifications.map((v, i) => ({
        id: `individual-${v.id}`,
        type: 'individual' as const,
        label: v.full_name || '',
        verifiedAt: v.reviewed_at?.toISOString() ?? null,
        ...badgeFields(i === 0, individualBadge, user.individual_verification_expires_at),
        amount: Number(v.payment_amount ?? 0),
        paymentStatus: v.payment_status ?? 'unknown',
        durationDays: v.duration_days,
      })),
    ].sort((a, b) => (b.verifiedAt || '').localeCompare(a.verifiedAt || ''));

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: user.id,
          fullName: user.full_name || 'Unknown',
          email: user.email || '',
          phone: user.phone || '',
          accountType: user.account_type || '',
          businessName: user.business_name || '',
          joinedAt: user.created_at?.toISOString() ?? null,
          shopSlug: user.custom_shop_slug || user.shop_slug || null,
        },
        // Test/demo account: still fully inspectable, just kept out of the totals.
        excludedFromReports: excluded.includes(userId),
        summary: {
          totalSpent,
          totalPurchases: verified.length,
          abandonedCheckouts: payments.filter(p => p.status === 'pending').length,
          failedPayments: payments.filter(p => p.status === 'failed').length,
        },
        badges: {
          business: {
            status: user.business_verification_status || 'none',
            verifiedAt: user.business_verified_at?.toISOString() ?? null,
            expiresAt: user.business_verification_expires_at?.toISOString() ?? null,
            expired: isExpired(user.business_verification_expires_at),
          },
          individual: {
            verified: !!user.individual_verified,
            verifiedAt: user.individual_verified_at?.toISOString() ?? null,
            expiresAt: user.individual_verification_expires_at?.toISOString() ?? null,
            expired: isExpired(user.individual_verification_expires_at),
          },
        },
        verifications,
        promotions: promotions.map(p => ({
          id: p.id,
          adId: p.ad_id,
          adTitle: p.ads?.title || `Ad #${p.ad_id}`,
          // ad_promotions is ON DELETE CASCADE from ads, so any row here still
          // has its ad; orphaned purchases only surface in the promotions list.
          adDeleted: false,
          adSlug: p.ads?.slug || null,
          type: p.promotion_type,
          durationDays: p.duration_days,
          pricePaid: Number(p.price_paid),
          paymentMethod: p.payment_method || '',
          // A staff-granted comp, not a sale. price_paid = 0 is the robust signal:
          // on prod it coincides with payment_method='manual', but no code path ever
          // writes 'manual' (those rows were hand-inserted), so the method string is
          // not something to rely on. `promoted_by` is NOT a comp flag — it records
          // who initiated the promotion, which for self-serve checkout is the buyer.
          comped: Number(p.price_paid) === 0,
          startsAt: p.starts_at?.toISOString() ?? null,
          expiresAt: p.expires_at.toISOString(),
          status: promotionStatus(p.is_active, p.expires_at),
        })),
        payments: payments.map(p => ({
          id: p.id,
          type: p.payment_type,
          gateway: p.payment_gateway,
          amount: Number(p.amount),
          transactionId: p.transaction_id,
          status: p.status,
          createdAt: p.created_at?.toISOString() ?? null,
          verifiedAt: p.verified_at?.toISOString() ?? null,
          failureReason: p.failure_reason,
        })),
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
