'use client';

import { StatsCard } from '@/components/admin';
import type { DashboardStats } from '../types';

interface StatsGridProps {
  stats: DashboardStats | null;
  avgResponseTimeTrendText: string;
}

export default function StatsGrid({ stats, avgResponseTimeTrendText }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Pending Ads"
        value={stats?.pendingAds || 0}
        icon="📢"
        color="primary"
        theme="editor"
        trend={{
          value: stats?.pendingChange || '',
          isPositive: true,
          label: 'from yesterday',
        }}
      />
      <StatsCard
        title="Pending Verifications"
        value={stats?.pendingVerifications || 0}
        icon="✅"
        color="success"
        theme="editor"
        trend={{
          value: stats?.verificationsChange || '',
          isPositive: false,
          label: 'decrease',
        }}
      />
      <StatsCard
        title="Avg. Response Time"
        value={stats?.avgResponseTime || '0h'}
        icon="⏱️"
        color="success"
        theme="editor"
        trend={{
          value: avgResponseTimeTrendText,
          isPositive: avgResponseTimeTrendText.includes('Improved'),
          label: '',
        }}
      />
    </div>
  );
}
