'use client';

import type { AnalyticsData } from './types';

interface QuickInsightsProps {
  overview: AnalyticsData['overview'];
  verifications: AnalyticsData['verifications'];
}

export function QuickInsights({ overview, verifications }: QuickInsightsProps) {
  const activeRate =
    overview.totalAds > 0 ? ((overview.activeAds / overview.totalAds) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
        <span>💡</span> Quick Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">User Growth</div>
              <div className="text-sm text-gray-600">
                {overview.userGrowth >= 0 ? 'Positive' : 'Negative'} growth of{' '}
                {Math.abs(overview.userGrowth)}% compared to previous period.
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Active Rate</div>
              <div className="text-sm text-gray-600">{activeRate}% of ads are currently active.</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Verification Rate</div>
              <div className="text-sm text-gray-600">
                {verifications.approvedBusiness + verifications.approvedIndividual} verified sellers
                on the platform.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
