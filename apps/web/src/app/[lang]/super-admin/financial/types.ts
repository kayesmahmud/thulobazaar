/**
 * Mirrors NEPAL_TZ in '@/lib/financial/time'. Not imported from there: that
 * module pulls in '@thulobazaar/database' (which instantiates the Prisma
 * client at import time) and this file is consumed by 'use client' components.
 */
const NEPAL_TZ = 'Asia/Kathmandu';

export interface FinancialStats {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    failedTransactions: {
      count: number;
      amount: number;
    };
    pendingTransactions: {
      count: number;
      amount: number;
    };
  };
  revenueByGateway: GatewayRevenue[];
  revenueByType: TypeRevenue[];
  promotionStats: PromotionStat[];
  dailyRevenue: DailyRevenue[];
  topCustomers: TopCustomer[];
}

export interface GatewayRevenue {
  gateway: string;
  revenue: number;
  transactions: number;
}

export interface TypeRevenue {
  type: string;
  revenue: number;
  transactions: number;
}

export interface PromotionStat {
  promotionType: string;
  totalPromotions: number;
  totalRevenue: number;
  activePromotions: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

export interface TopCustomer {
  id: number;
  fullName: string;
  email: string;
  totalSpent: number;
  transactions: number;
}

export type PeriodType = 'today' | 'yesterday' | 'thisweek' | 'thismonth' | '7days' | '30days' | '90days' | 'all';
export type FilterMode = 'preset' | 'custom';

export interface PeriodOption {
  value: PeriodType;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisweek', label: 'This Week' },
  { value: 'thismonth', label: 'This Month' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ---------------------------------------------------------------------------
// Monthly purchase history + customer drill-down
// ---------------------------------------------------------------------------

export interface MonthlyRow {
  month: string;
  promotions: number;
  businessVerifications: number;
  individualVerifications: number;
  buyers: number;
  revenue: number;
}

export interface MonthlyReport {
  months: MonthlyRow[];
  totals: { purchases: number; revenue: number };
}

/**
 * active  = is_active AND not expired
 * ended   = deactivated/replaced (e.g. extended) before its expiry
 * expired = past expires_at
 * unknown = orphan payment whose ad (and promotion row) was deleted
 */
export type PromotionStatus = 'active' | 'ended' | 'expired' | 'unknown';

export interface CustomerPromotion {
  id: number;
  adId: number | null;
  adTitle: string;
  /** The ad was hard-deleted; the purchase is kept from the payment record. */
  adDeleted: boolean;
  adSlug: string | null;
  type: string;
  durationDays: number | null;
  pricePaid: number;
  paymentMethod: string;
  comped: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  status: PromotionStatus;
}

export interface CustomerPayment {
  id: number;
  type: string;
  gateway: string;
  amount: number;
  transactionId: string;
  status: string | null;
  createdAt: string | null;
  verifiedAt: string | null;
  failureReason: string | null;
}

export interface CustomerDetail {
  customer: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    accountType: string;
    businessName: string;
    joinedAt: string | null;
    shopSlug: string | null;
  };
  summary: {
    totalSpent: number;
    totalPurchases: number;
    abandonedCheckouts: number;
    failedPayments: number;
  };
  badges: {
    business: {
      status: string;
      verifiedAt: string | null;
      expiresAt: string | null;
      expired: boolean;
    };
    individual: {
      verified: boolean;
      verifiedAt: string | null;
      expiresAt: string | null;
      expired: boolean;
    };
  };
  promotions: CustomerPromotion[];
  verifications: CustomerVerification[];
  payments: CustomerPayment[];
  /** Marked as a test account — omitted from every aggregate on the Financial page. */
  excludedFromReports: boolean;
}

/** "ad_promotion" -> "Ad Promotion" */
export const formatPaymentType = (type: string): string =>
  type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** "2026-08" -> "August 2026" (long) or "Aug 2026" (short). Echoes malformed input unchanged. */
export const formatMonth = (month: string, style: 'long' | 'short' = 'long'): string => {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: style, year: 'numeric' });
};

/**
 * Timestamps are stored as naive UTC; the owner reads them in Nepal, so the
 * displayed day must be the Nepal calendar day or a purchase at 00:15 NPT on
 * the 1st shows as the previous month's last day.
 */
export const formatDate = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: NEPAL_TZ,
      })
    : '—';

// ---------------------------------------------------------------------------
// Promotions purchased (monthly) — GET /api/editor/financial/promotions
// ---------------------------------------------------------------------------

export interface PromotionRow {
  /** 'promo-<ad_promotions.id>' or 'txn-<payment_transactions.id>' for orphan payments */
  id: string;
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  shopSlug: string | null;
  adId: number | null;
  adTitle: string;
  /** The ad was hard-deleted; the purchase is kept from the payment record. */
  adDeleted: boolean;
  /** featured | urgent | sticky | bump_up */
  type: string;
  durationDays: number | null;
  pricePaid: number;
  comped: boolean;
  purchasedAt: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  status: PromotionStatus;
}

export interface PromotionMonth {
  month: string;
  purchases: number;
  buyers: number;
  revenue: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PromotionsResponse {
  rows: PromotionRow[];
  months: PromotionMonth[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Verifications granted (monthly) — GET /api/editor/financial/verifications
// Most rows are free badge grants, not sales.
// ---------------------------------------------------------------------------

export interface VerificationRow {
  id: string;
  type: 'business' | 'individual';
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  shopSlug: string | null;
  label: string;
  verifiedAt: string | null;
  /** An older grant of the same badge — a newer row describes the live badge. */
  superseded: boolean;
  /** The current badge was revoked by staff (status 'revoked' / individual_verified=false). */
  revoked: boolean;
  expiresAt: string | null;
  expired: boolean;
  amount: number;
  /** 'free' | 'paid' | 'pending' */
  paymentStatus: string;
  durationDays: number | null;
}

export interface VerificationMonth {
  month: string;
  business: number;
  individual: number;
  revenue: number;
}

export interface VerificationsResponse {
  rows: VerificationRow[];
  months: VerificationMonth[];
  pagination: Pagination;
}

/** A verification badge shown on the customer drill-down page (the customer columns are implied). */
export type CustomerVerification = Omit<
  VerificationRow,
  'userId' | 'userName' | 'userPhone' | 'userEmail' | 'shopSlug'
>;
