'use client';

import { StatsCard } from '@/components/admin';
import type { DashboardStats } from '../types';

interface StatsGridProps {
  stats: DashboardStats | null;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total Users"
        value={(stats?.totalUsers ?? 0).toLocaleString()}
        icon="👥"
        color="primary"
        theme="superadmin"
        trend={{
          value: stats?.usersThisWeek ? `+${stats.usersThisWeek}` : '0',
          isPositive: true,
          label: 'this week',
        }}
      />
      <StatsCard
        title="Active Ads"
        value={(stats?.activeAds ?? 0).toLocaleString()}
        icon="📢"
        color="success"
        theme="superadmin"
        trend={{
          value: stats?.adsThisWeek ? `+${stats.adsThisWeek}` : '0',
          isPositive: true,
          label: 'this week',
        }}
      />
      <StatsCard
        title="Pending Ads"
        value={(stats?.pendingAds ?? 0).toLocaleString()}
        icon="⏳"
        color="warning"
        theme="superadmin"
        trend={{
          value: 'Requires attention',
          isPositive: false,
          label: '',
        }}
      />
      <StatsCard
        title="Total Ads"
        value={(stats?.totalAds ?? 0).toLocaleString()}
        icon="📊"
        color="primary"
        theme="superadmin"
        trend={{
          value: 'All time',
          isPositive: true,
          label: '',
        }}
      />
    </div>
  );
}
