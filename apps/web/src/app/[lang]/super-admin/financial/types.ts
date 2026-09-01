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

export interface CustomerListItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  purchases: number;
  totalSpent: number;
  firstPurchase: string | null;
  lastPurchase: string | null;
  bought: string[];
  activePromotions: number;
}

export interface CustomerPromotion {
  id: number;
  adId: number;
  adTitle: string;
  adSlug: string | null;
  type: string;
  durationDays: number;
  pricePaid: number;
  paymentMethod: string;
  comped: boolean;
  startsAt: string | null;
  expiresAt: string;
  expired: boolean;
  isActive: boolean;
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
  payments: CustomerPayment[];
}

/** "ad_promotion" -> "Ad Promotion" */
export const formatPaymentType = (type: string): string =>
  type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** "2026-08" -> "August 2026" */
export const formatMonth = (month: string): string => {
  const [year, m] = month.split('-');
  if (!year || !m) return month;
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ---------------------------------------------------------------------------
// Promotions purchased (monthly) — GET /api/editor/financial/promotions
// ---------------------------------------------------------------------------

export interface PromotionRow {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  shopSlug: string | null;
  adId: number;
  adTitle: string;
  /** featured | urgent | sticky | bump_up */
  type: string;
  durationDays: number;
  pricePaid: number;
  paymentMethod: string;
  comped: boolean;
  purchasedAt: string | null;
  startsAt: string | null;
  expiresAt: string;
  expired: boolean;
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
  superseded: boolean;
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

/** A verification badge shown on the customer drill-down page. */
export interface CustomerVerification {
  id: string;
  type: 'business' | 'individual';
  label: string;
  verifiedAt: string | null;
  superseded: boolean;
  expiresAt: string | null;
  expired: boolean;
  amount: number;
  paymentStatus: string;
  durationDays: number | null;
}

/** "2026-08" -> "Aug 2026" */
export const formatMonthShort = (month: string): string => {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
