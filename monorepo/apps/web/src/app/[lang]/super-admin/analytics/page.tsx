'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getSuperAdminNavSections } from '@/lib/navigation';
import {
  useAnalyticsPage,
  BarChart,
  AreaChart,
  DonutChart,
  PeriodSelector,
  OverviewStats,
  VerificationStats,
  formatNumber,
  formatCurrency,
  STATUS_COLORS,
  CATEGORY_COLORS,
} from './components';

export default function AnalyticsPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);
  const navSections = getSuperAdminNavSections(params.lang);

  const {
    staff,
    authLoading,
    handleLogout,
    periodMode,
    setPeriodMode,
    timeRange,
    setTimeRange,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    loading,
    analytics,
    loadAnalytics,
  } = useAnalyticsPage(params.lang);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">📊</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName || 'Admin'}
        userEmail={staff?.email || ''}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700">Failed to load analytics</h2>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Admin'}
      userEmail={staff?.email || ''}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 mt-1">Platform performance and insights</p>
          </div>
        </div>

        {/* Period Selection */}
        <PeriodSelector
          periodMode={periodMode}
          setPeriodMode={setPeriodMode}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />

        {/* Overview Stats */}
        <OverviewStats overview={analytics.overview} />

        {/* Verification Stats */}
        <VerificationStats verifications={analytics.verifications} />

        {/* Growth Charts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Growth Trends</h3>
          <p className="text-sm text-gray-500 mb-6">New users, ads, and revenue over time</p>
          <AreaChart
            labels={analytics.charts.labels}
            datasets={[
              { data: analytics.charts.users, color: 'bg-blue-500', label: 'New Users' },
              { data: analytics.charts.ads, color: 'bg-green-500', label: 'New Ads' },
            ]}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ad Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ad Status Distribution</h3>
            <p className="text-sm text-gray-500 mb-6">Breakdown of ads by current status</p>
            <DonutChart
              data={analytics.adsByStatus.map((item, index) => ({
                label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                value: item.count,
                color:
                  STATUS_COLORS[item.status] ??
                  CATEGORY_COLORS[index % CATEGORY_COLORS.length] ??
                  'bg-gray-500',
              }))}
            />
          </div>

          {/* User Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">User Types</h3>
            <p className="text-sm text-gray-500 mb-6">Distribution by account type</p>
            <DonutChart
              data={analytics.usersByType.map((item, index) => ({
                label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                value: item.count,
                color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'bg-gray-500',
              }))}
            />
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Top Categories</h3>
          <p className="text-sm text-gray-500 mb-6">Most popular categories by ad count</p>
          <BarChart
            data={analytics.topCategories.map((cat, index) => ({
              label: cat.name,
              value: cat.adCount,
              color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'bg-gray-500',
            }))}
          />
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Top Locations</h3>
          <p className="text-sm text-gray-500 mb-6">Most active locations by ad count</p>
          <BarChart
            data={analytics.topLocations.map((loc, index) => ({
              label: loc.name,
              value: loc.adCount,
              color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'bg-gray-500',
            }))}
          />
        </div>

        {/* Revenue Breakdown */}
        {analytics.revenueByType.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Revenue by Type</h3>
            <p className="text-sm text-gray-500 mb-6">Payment breakdown by transaction type</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Transactions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.revenueByType.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                        {item.type || 'Other'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Period Report Summary */}
        {analytics.summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Period Report: {analytics.period.label}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(analytics.period.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  -{' '}
                  {new Date(analytics.period.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-3xl">📋</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {formatNumber(analytics.summary.totalNewUsers)}
                </div>
                <div className="text-sm text-blue-600">New Users</div>
                <div className="text-xs text-blue-500 mt-1">
                  ~{analytics.summary.avgUsersPerDay}/day avg
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {formatNumber(analytics.summary.totalNewAds)}
                </div>
                <div className="text-sm text-green-600">New Ads</div>
                <div className="text-xs text-green-500 mt-1">
                  ~{analytics.summary.avgAdsPerDay}/day avg
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(analytics.summary.totalRevenue)}
                </div>
                <div className="text-sm text-purple-600">Total Revenue</div>
                <div className="text-xs text-purple-500 mt-1">
                  ~{formatCurrency(analytics.summary.avgRevenuePerDay)}/day avg
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">
                  {analytics.summary.totalTransactions}
                </div>
                <div className="text-sm text-orange-600">Transactions</div>
                <div className="text-xs text-orange-500 mt-1">
                  {analytics.summary.verificationsProcessed} verifications
                </div>
              </div>
            </div>

            {/* Period Verification Activity */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Verification Activity This Period
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">
                    {analytics.verifications.newBusinessRequests}
                  </div>
                  <div className="text-xs text-gray-500">New Business Requests</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">
                    {analytics.verifications.newIndividualRequests}
                  </div>
                  <div className="text-xs text-gray-500">New Individual Requests</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">
                    {analytics.verifications.approvedBusinessInPeriod}
                  </div>
                  <div className="text-xs text-green-600">Business Approved</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">
                    {analytics.verifications.approvedIndividualInPeriod}
                  </div>
                  <div className="text-xs text-green-600">Individual Approved</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Insights */}
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
                    {analytics.overview.userGrowth >= 0 ? 'Positive' : 'Negative'} growth of{' '}
                    {Math.abs(analytics.overview.userGrowth)}% compared to previous period.
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Active Rate</div>
                  <div className="text-sm text-gray-600">
                    {analytics.overview.totalAds > 0
                      ? ((analytics.overview.activeAds / analytics.overview.totalAds) * 100).toFixed(
                          1
                        )
                      : 0}
                    % of ads are currently active.
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Verification Rate</div>
                  <div className="text-sm text-gray-600">
                    {analytics.verifications.approvedBusiness +
                      analytics.verifications.approvedIndividual}{' '}
                    verified sellers on the platform.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
