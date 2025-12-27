'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useFinancialStats } from './useFinancialStats';
import {
  FilterSection,
  SummaryCards,
  RevenueByGateway,
  RevenueByType,
  PromotionStatsTable,
  TopCustomersTable,
  DailyRevenueTrend,
} from './components';

export default function FinancialTrackingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const {
    stats,
    loading,
    authLoading,
    staff,
    period,
    setPeriod,
    filterMode,
    setFilterMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loadStats,
    handleLogout,
  } = useFinancialStats(params.lang);

  const navSections = getSuperAdminNavSections(params.lang);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName}
      userEmail={staff?.email}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor revenue, transactions, and payment analytics</p>
        </div>

        {/* Filter Section */}
        <FilterSection
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          period={period}
          onPeriodChange={setPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onApply={loadStats}
        />

        {/* Summary Cards */}
        {stats && <SummaryCards summary={stats.summary} />}

        {/* Revenue by Gateway & Type */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueByGateway data={stats.revenueByGateway} />
            <RevenueByType data={stats.revenueByType} />
          </div>
        )}

        {/* Promotion Stats */}
        {stats && <PromotionStatsTable data={stats.promotionStats} />}

        {/* Top Customers */}
        {stats && <TopCustomersTable data={stats.topCustomers} />}

        {/* Daily Revenue Trend */}
        {stats && <DailyRevenueTrend data={stats.dailyRevenue} />}
      </div>
    </DashboardLayout>
  );
}
