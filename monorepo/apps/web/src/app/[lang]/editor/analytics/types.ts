export interface AnalyticsData {
  overview: {
    totalAdsReviewed: number;
    totalAdsApproved: number;
    totalAdsRejected: number;
    totalVerifications: number;
    avgResponseTime: number;
    approvalRate: number;
  };
  dailyStats: {
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
  editorPerformance: {
    name: string;
    reviewed: number;
    approved: number;
    rejected: number;
    avgTime: number;
  }[];
  rejectionReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  hourlyActivity: {
    hour: number;
    count: number;
  }[];
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface BarChartData {
  label: string;
  value: number;
  color: string;
}

export interface PieChartData {
  category: string;
  percentage: number;
  color: string;
}
