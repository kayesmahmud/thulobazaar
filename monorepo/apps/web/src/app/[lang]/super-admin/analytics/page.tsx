'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getSuperAdminNavSections } from '@/lib/navigation';
import {
  useAnalyticsPage,
  PeriodSelector,
  OverviewStats,
  VerificationStats,
  GrowthTrendsChart,
  DistributionSection,
  TopCharts,
  RevenueTable,
  PeriodReport,
  QuickInsights,
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

        <OverviewStats overview={analytics.overview} />

        <VerificationStats verifications={analytics.verifications} />

        <GrowthTrendsChart charts={analytics.charts} />

        <DistributionSection
          adsByStatus={analytics.adsByStatus}
          usersByType={analytics.usersByType}
        />

        <TopCharts
          topCategories={analytics.topCategories}
          topLocations={analytics.topLocations}
        />

        <RevenueTable revenueByType={analytics.revenueByType} />

        {analytics.summary && (
          <PeriodReport
            period={analytics.period}
            summary={analytics.summary}
            verifications={analytics.verifications}
          />
        )}

        <QuickInsights overview={analytics.overview} verifications={analytics.verifications} />
      </div>
    </DashboardLayout>
  );
}
