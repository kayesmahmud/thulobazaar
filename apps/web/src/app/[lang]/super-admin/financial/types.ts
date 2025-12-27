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
