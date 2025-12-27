'use client';

import { formatNumber, formatCurrency, getGrowthColor, getGrowthIcon } from './types';
import type { AnalyticsData } from './types';

interface OverviewStatsProps {
  overview: AnalyticsData['overview'];
}

export function OverviewStats({ overview }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Users */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">👥</span>
          <span className={`text-sm font-medium ${getGrowthColor(overview.userGrowth)}`}>
            {getGrowthIcon(overview.userGrowth)} {Math.abs(overview.userGrowth)}%
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalUsers)}</div>
        <div className="text-sm text-gray-500">Total Users</div>
        <div className="text-xs text-gray-400 mt-1">+{formatNumber(overview.newUsers)} new</div>
      </div>

      {/* Ads */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">📦</span>
          <span className={`text-sm font-medium ${getGrowthColor(overview.adGrowth)}`}>
            {getGrowthIcon(overview.adGrowth)} {Math.abs(overview.adGrowth)}%
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalAds)}</div>
        <div className="text-sm text-gray-500">Total Ads</div>
        <div className="text-xs text-gray-400 mt-1">{formatNumber(overview.activeAds)} active</div>
      </div>

      {/* Views */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">👁️</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalViews)}</div>
        <div className="text-sm text-gray-500">Total Views</div>
        <div className="text-xs text-gray-400 mt-1">All time</div>
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">💰</span>
          <span className={`text-sm font-medium ${getGrowthColor(overview.revenueGrowth)}`}>
            {getGrowthIcon(overview.revenueGrowth)} {Math.abs(overview.revenueGrowth)}%
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(overview.totalRevenue)}
        </div>
        <div className="text-sm text-gray-500">Revenue</div>
        <div className="text-xs text-gray-400 mt-1">This period</div>
      </div>
    </div>
  );
}

interface VerificationStatsProps {
  verifications: AnalyticsData['verifications'];
}

export function VerificationStats({ verifications }: VerificationStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
        <div className="text-3xl font-bold text-amber-700">
          {verifications.pendingBusiness + verifications.pendingIndividual}
        </div>
        <div className="text-sm text-amber-600">Pending Verifications</div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
        <div className="text-3xl font-bold text-blue-700">{verifications.approvedBusiness}</div>
        <div className="text-sm text-blue-600">Verified Business</div>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
        <div className="text-3xl font-bold text-emerald-700">
          {verifications.approvedIndividual}
        </div>
        <div className="text-sm text-emerald-600">Verified Individual</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
        <div className="text-3xl font-bold text-purple-700">
          {verifications.approvedBusiness + verifications.approvedIndividual}
        </div>
        <div className="text-sm text-purple-600">Total Verified</div>
      </div>
    </div>
  );
}
