'use client';

import type { SystemHealthData } from '../types';

interface MetricsSectionProps {
  performanceMetrics: SystemHealthData['performanceMetrics'];
  businessMetrics: SystemHealthData['businessMetrics'];
}

export default function MetricsSection({ performanceMetrics, businessMetrics }: MetricsSectionProps) {
  const pendingVerifications =
    parseInt(businessMetrics.pendingVerifications.pending_business) +
    parseInt(businessMetrics.pendingVerifications.pending_individual);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Performance</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Errors (24h):</span>
            <span className={`font-semibold ${performanceMetrics.errorsLast24h > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {performanceMetrics.errorsLast24h}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Active Users (30m):</span>
            <span className="font-semibold">{performanceMetrics.activeUsers}</span>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Business Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-indigo-600">{businessMetrics.ads.active_ads}</div>
            <div className="text-sm text-gray-600">Active Ads</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{businessMetrics.ads.pending_ads}</div>
            <div className="text-sm text-gray-600">Pending Ads</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{businessMetrics.users.active_users}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{pendingVerifications}</div>
            <div className="text-sm text-gray-600">Pending Verifications</div>
          </div>
        </div>
      </div>
    </div>
  );
}
