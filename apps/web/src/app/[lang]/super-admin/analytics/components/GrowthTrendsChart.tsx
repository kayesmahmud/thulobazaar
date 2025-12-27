'use client';

import { AreaChart } from './Charts';
import type { AnalyticsData } from './types';

interface GrowthTrendsChartProps {
  charts: AnalyticsData['charts'];
}

export function GrowthTrendsChart({ charts }: GrowthTrendsChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Growth Trends</h3>
      <p className="text-sm text-gray-500 mb-6">New users, ads, and revenue over time</p>
      <AreaChart
        labels={charts.labels}
        datasets={[
          { data: charts.users, color: 'bg-blue-500', label: 'New Users' },
          { data: charts.ads, color: 'bg-green-500', label: 'New Ads' },
        ]}
      />
    </div>
  );
}
