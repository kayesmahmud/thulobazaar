'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface FinancialStats {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    failedTransactions: {
      count: number;
      amount: number;
    };
    pendingTransactions: {
      count: number;
      amount: number;
    };
  };
  revenueByGateway: Array<{
    gateway: string;
    revenue: number;
    transactions: number;
  }>;
  revenueByType: Array<{
    type: string;
    revenue: number;
    transactions: number;
  }>;
  promotionStats: Array<{
    promotionType: string;
    totalPromotions: number;
    totalRevenue: number;
    activePromotions: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  topCustomers: Array<{
    id: number;
    fullName: string;
    email: string;
    totalSpent: number;
    transactions: number;
  }>;
}

export default function FinancialTrackingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'thisweek' | 'thismonth' | '7days' | '30days' | '90days' | 'all'>('30days');
  const [filterMode, setFilterMode] = useState<'preset' | 'custom'>('preset');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      // Build params based on filter mode
      const params: any = {};

      if (filterMode === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else {
        params.period = period;
      }

      const response = await apiClient.getFinancialStats(params);

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading financial stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period, filterMode, startDate, endDate]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadStats();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadStats]);

  const navSections = getSuperAdminNavSections(params.lang);

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilterMode('preset')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filterMode === 'preset'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quick Filters
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filterMode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Date Range
            </button>
          </div>

          {/* Preset Periods */}
          {filterMode === 'preset' && (
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'thisweek', label: 'This Week' },
                { value: 'thismonth', label: 'This Month' },
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' },
                { value: 'all', label: 'All Time' },
              ] as const).map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    period === p.value
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Custom Date Range */}
          {filterMode === 'custom' && (
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                onClick={loadStats}
                disabled={!startDate && !endDate}
                className={`px-8 py-2 rounded-lg font-semibold transition-all ${
                  startDate || endDate
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Apply
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-6 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.summary.totalRevenue)}</div>
              <div className="text-sm text-gray-500 mt-1">{stats.summary.totalTransactions} transactions</div>
            </div>

            {/* Pending Transactions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.summary.pendingTransactions.amount)}</div>
              <div className="text-sm text-gray-500 mt-1">{stats.summary.pendingTransactions.count} transactions</div>
            </div>

            {/* Failed Transactions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Failed</div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">❌</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">{formatCurrency(stats.summary.failedTransactions.amount)}</div>
              <div className="text-sm text-gray-500 mt-1">{stats.summary.failedTransactions.count} transactions</div>
            </div>

            {/* Success Rate */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.summary.totalTransactions > 0
                  ? ((stats.summary.totalTransactions / (stats.summary.totalTransactions + stats.summary.failedTransactions.count)) * 100).toFixed(1)
                  : '0'}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Of all transactions</div>
            </div>
          </div>
        )}

        {/* Revenue by Gateway & Type */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by Gateway */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Revenue by Payment Gateway</h3>
              </div>
              <div className="p-6">
                {stats.revenueByGateway.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No data available</p>
                ) : (
                  <div className="space-y-4">
                    {stats.revenueByGateway.map((gateway, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">{gateway.gateway}</div>
                          <div className="text-sm text-gray-500">{gateway.transactions} transactions</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(gateway.revenue)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Revenue by Type */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Revenue by Payment Type</h3>
              </div>
              <div className="p-6">
                {stats.revenueByType.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No data available</p>
                ) : (
                  <div className="space-y-4">
                    {stats.revenueByType.map((type, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 capitalize">{type.type.replace('_', ' ')}</div>
                          <div className="text-sm text-gray-500">{type.transactions} transactions</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(type.revenue)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Promotion Stats */}
        {stats && stats.promotionStats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Promotion Revenue</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Promotion Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Promotions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Active</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.promotionStats.map((promo, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900 capitalize">{promo.promotionType}</td>
                      <td className="px-6 py-4 text-gray-600">{promo.totalPromotions}</td>
                      <td className="px-6 py-4 text-gray-600">{promo.activePromotions}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(promo.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Customers */}
        {stats && stats.topCustomers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transactions</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.topCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{customer.fullName}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{customer.transactions}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Daily Revenue Trend */}
        {stats && stats.dailyRevenue.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Daily Revenue Trend (Last 30 Days)</h3>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {stats.dailyRevenue.map((day, index) => {
                  const maxRevenue = Math.max(...stats.dailyRevenue.map(d => d.revenue));
                  const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-gray-600">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full flex items-center px-3"
                            style={{ width: `${percentage}%` }}
                          >
                            {day.revenue > 0 && (
                              <span className="text-white text-sm font-semibold">{formatCurrency(day.revenue)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-500 text-right">{day.transactions} txn</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
