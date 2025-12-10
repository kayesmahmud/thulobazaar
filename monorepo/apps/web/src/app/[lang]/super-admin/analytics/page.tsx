'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface AnalyticsData {
  period: {
    type: 'days' | 'month' | 'year';
    label: string;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
    totalAds: number;
    activeAds: number;
    newAds: number;
    adGrowth: number;
    totalViews: number;
    periodViews: number;
    totalRevenue: number;
    revenueGrowth: number;
  };
  verifications: {
    pendingBusiness: number;
    pendingIndividual: number;
    approvedBusiness: number;
    approvedIndividual: number;
    newBusinessRequests: number;
    newIndividualRequests: number;
    approvedBusinessInPeriod: number;
    approvedIndividualInPeriod: number;
  };
  charts: {
    labels: string[];
    users: number[];
    ads: number[];
    revenue: number[];
  };
  usersByType: { type: string; count: number }[];
  adsByStatus: { status: string; count: number }[];
  topCategories: { id: number; name: string; adCount: number; views: number }[];
  topLocations: { id: number; name: string; adCount: number }[];
  revenueByType: { type: string; amount: number; count: number }[];
  summary: {
    totalNewUsers: number;
    totalNewAds: number;
    totalRevenue: number;
    totalTransactions: number;
    verificationsProcessed: number;
    avgRevenuePerDay: number;
    avgAdsPerDay: number;
    avgUsersPerDay: number;
  };
}

type TimeRange = '7d' | '30d' | '90d';
type PeriodMode = 'quick' | 'monthly' | 'yearly';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate years from 2025 to 2030
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
const currentYear = new Date().getFullYear();

export default function AnalyticsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [periodMode, setPeriodMode] = useState<PeriodMode>('quick');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Build query string based on period mode
      let queryParams: string;
      if (periodMode === 'quick') {
        queryParams = `range=${timeRange}`;
      } else if (periodMode === 'monthly') {
        queryParams = `month=${selectedMonth}&year=${selectedYear}`;
      } else {
        queryParams = `year=${selectedYear}`;
      }

      const res = await fetch(`/api/super-admin/analytics?${queryParams}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [periodMode, timeRange, selectedMonth, selectedYear]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }
    loadAnalytics();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadAnalytics]);

  const navSections = getSuperAdminNavSections(params.lang);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return 'Rs. ' + amount.toLocaleString();
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↑';
    if (growth < 0) return '↓';
    return '→';
  };

  // Simple bar chart renderer
  const renderBarChart = (data: { label: string; value: number; color: string }[]) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 truncate">{item.label}</span>
              <span className="text-gray-600 ml-2">{formatNumber(item.value)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`${item.color} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Line/Area chart renderer
  const renderAreaChart = (
    labels: string[],
    datasets: { data: number[]; color: string; label: string }[]
  ) => {
    const allValues = datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues, 1);
    const chartHeight = 200;

    return (
      <div className="relative">
        <div className="flex items-end justify-between h-[200px] px-2 gap-1">
          {labels.map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex items-end gap-0.5 w-full justify-center h-full">
                {datasets.map((dataset, dIndex) => {
                  const value = dataset.data[index] || 0;
                  const height = (value / maxValue) * chartHeight;
                  return (
                    <div
                      key={dIndex}
                      className={`${dataset.color} rounded-t w-full max-w-[20px] transition-all duration-300 hover:opacity-80`}
                      style={{ height: `${Math.max(height, 2)}px` }}
                      title={`${dataset.label}: ${formatNumber(value)}`}
                    />
                  );
                })}
              </div>
              {index % Math.ceil(labels.length / 10) === 0 && (
                <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">{label}</div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          {datasets.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-4 h-4 ${dataset.color} rounded`} />
              <span className="text-sm text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Donut chart renderer
  const renderDonutChart = (data: { label: string; value: number; color: string }[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-gray-400 py-8">No data available</div>;

    let currentAngle = 0;
    const paths = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const largeArcFlag = angle > 180 ? 1 : 0;
      const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
      const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
      const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);

      // For donut, we use path instead of pie slice
      const outerX1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
      const outerY1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
      const outerX2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
      const outerY2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
      const innerX1 = 50 + 25 * Math.cos((startAngle * Math.PI) / 180);
      const innerY1 = 50 + 25 * Math.sin((startAngle * Math.PI) / 180);
      const innerX2 = 50 + 25 * Math.cos((endAngle * Math.PI) / 180);
      const innerY2 = 50 + 25 * Math.sin((endAngle * Math.PI) / 180);

      const path = `
        M ${outerX1} ${outerY1}
        A 40 40 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
        L ${innerX2} ${innerY2}
        A 25 25 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
        Z
      `;

      const colors: Record<string, string> = {
        'bg-blue-500': '#3B82F6',
        'bg-green-500': '#22C55E',
        'bg-purple-500': '#A855F7',
        'bg-orange-500': '#F97316',
        'bg-teal-500': '#14B8A6',
        'bg-pink-500': '#EC4899',
        'bg-yellow-500': '#EAB308',
        'bg-red-500': '#EF4444',
        'bg-indigo-500': '#6366F1',
        'bg-cyan-500': '#06B6D4',
      };

      return (
        <path
          key={index}
          d={path}
          fill={colors[item.color] || '#9CA3AF'}
          className="hover:opacity-80 transition-opacity cursor-pointer"
        />
      );
    });

    return (
      <div className="flex items-center justify-center gap-6">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {paths}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatNumber(total)}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm text-gray-500">({formatNumber(item.value)})</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

  const statusColors: Record<string, string> = {
    approved: 'bg-green-500',
    active: 'bg-green-500',
    pending: 'bg-yellow-500',
    rejected: 'bg-red-500',
    suspended: 'bg-orange-500',
    deleted: 'bg-gray-500',
  };

  const categoryColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];

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

        {/* Period Selection Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Period Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setPeriodMode('quick')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  periodMode === 'quick'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Quick Range
              </button>
              <button
                onClick={() => setPeriodMode('monthly')}
                className={`px-4 py-2 text-sm font-medium transition-all border-l border-gray-300 ${
                  periodMode === 'monthly'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriodMode('yearly')}
                className={`px-4 py-2 text-sm font-medium transition-all border-l border-gray-300 ${
                  periodMode === 'yearly'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Yearly
              </button>
            </div>

            {/* Quick Range Buttons */}
            {periodMode === 'quick' && (
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      timeRange === range
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            )}

            {/* Monthly Selection */}
            {periodMode === 'monthly' && (
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Yearly Selection */}
            {periodMode === 'yearly' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Period Display */}
            <div className="ml-auto text-sm text-gray-500">
              {periodMode === 'quick' && (
                <span>
                  Showing last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                </span>
              )}
              {periodMode === 'monthly' && (
                <span>
                  Showing {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              )}
              {periodMode === 'yearly' && (
                <span>
                  Showing full year {selectedYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👥</span>
              <span className={`text-sm font-medium ${getGrowthColor(analytics.overview.userGrowth)}`}>
                {getGrowthIcon(analytics.overview.userGrowth)} {Math.abs(analytics.overview.userGrowth)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalUsers)}</div>
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-xs text-gray-400 mt-1">
              +{formatNumber(analytics.overview.newUsers)} new
            </div>
          </div>

          {/* Ads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📦</span>
              <span className={`text-sm font-medium ${getGrowthColor(analytics.overview.adGrowth)}`}>
                {getGrowthIcon(analytics.overview.adGrowth)} {Math.abs(analytics.overview.adGrowth)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalAds)}</div>
            <div className="text-sm text-gray-500">Total Ads</div>
            <div className="text-xs text-gray-400 mt-1">
              {formatNumber(analytics.overview.activeAds)} active
            </div>
          </div>

          {/* Views */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👁️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.overview.totalViews)}</div>
            <div className="text-sm text-gray-500">Total Views</div>
            <div className="text-xs text-gray-400 mt-1">All time</div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">💰</span>
              <span className={`text-sm font-medium ${getGrowthColor(analytics.overview.revenueGrowth)}`}>
                {getGrowthIcon(analytics.overview.revenueGrowth)} {Math.abs(analytics.overview.revenueGrowth)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.overview.totalRevenue)}</div>
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-xs text-gray-400 mt-1">This period</div>
          </div>
        </div>

        {/* Verification Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-amber-700">
              {analytics.verifications.pendingBusiness + analytics.verifications.pendingIndividual}
            </div>
            <div className="text-sm text-amber-600">Pending Verifications</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-700">{analytics.verifications.approvedBusiness}</div>
            <div className="text-sm text-blue-600">Verified Business</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-emerald-700">{analytics.verifications.approvedIndividual}</div>
            <div className="text-sm text-emerald-600">Verified Individual</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-700">
              {analytics.verifications.approvedBusiness + analytics.verifications.approvedIndividual}
            </div>
            <div className="text-sm text-purple-600">Total Verified</div>
          </div>
        </div>

        {/* Growth Charts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Growth Trends</h3>
          <p className="text-sm text-gray-500 mb-6">New users, ads, and revenue over time</p>
          {renderAreaChart(analytics.charts.labels, [
            { data: analytics.charts.users, color: 'bg-blue-500', label: 'New Users' },
            { data: analytics.charts.ads, color: 'bg-green-500', label: 'New Ads' },
          ])}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ad Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ad Status Distribution</h3>
            <p className="text-sm text-gray-500 mb-6">Breakdown of ads by current status</p>
            {renderDonutChart(
              analytics.adsByStatus.map((item, index) => ({
                label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                value: item.count,
                color: statusColors[item.status] ?? categoryColors[index % categoryColors.length] ?? 'bg-gray-500',
              }))
            )}
          </div>

          {/* User Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">User Types</h3>
            <p className="text-sm text-gray-500 mb-6">Distribution by account type</p>
            {renderDonutChart(
              analytics.usersByType.map((item, index) => ({
                label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                value: item.count,
                color: categoryColors[index % categoryColors.length] ?? 'bg-gray-500',
              }))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Top Categories</h3>
          <p className="text-sm text-gray-500 mb-6">Most popular categories by ad count</p>
          {renderBarChart(
            analytics.topCategories.map((cat, index) => ({
              label: cat.name,
              value: cat.adCount,
              color: categoryColors[index % categoryColors.length] ?? 'bg-gray-500',
            }))
          )}
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Top Locations</h3>
          <p className="text-sm text-gray-500 mb-6">Most active locations by ad count</p>
          {renderBarChart(
            analytics.topLocations.map((loc, index) => ({
              label: loc.name,
              value: loc.adCount,
              color: categoryColors[index % categoryColors.length] ?? 'bg-gray-500',
            }))
          )}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.revenueByType.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">{item.type || 'Other'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{formatCurrency(item.amount)}</td>
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
                <h3 className="text-xl font-bold text-gray-900">Period Report: {analytics.period.label}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(analytics.period.startDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })} - {new Date(analytics.period.endDate).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <span className="text-3xl">📋</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{formatNumber(analytics.summary.totalNewUsers)}</div>
                <div className="text-sm text-blue-600">New Users</div>
                <div className="text-xs text-blue-500 mt-1">~{analytics.summary.avgUsersPerDay}/day avg</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{formatNumber(analytics.summary.totalNewAds)}</div>
                <div className="text-sm text-green-600">New Ads</div>
                <div className="text-xs text-green-500 mt-1">~{analytics.summary.avgAdsPerDay}/day avg</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{formatCurrency(analytics.summary.totalRevenue)}</div>
                <div className="text-sm text-purple-600">Total Revenue</div>
                <div className="text-xs text-purple-500 mt-1">~{formatCurrency(analytics.summary.avgRevenuePerDay)}/day avg</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">{analytics.summary.totalTransactions}</div>
                <div className="text-sm text-orange-600">Transactions</div>
                <div className="text-xs text-orange-500 mt-1">{analytics.summary.verificationsProcessed} verifications</div>
              </div>
            </div>

            {/* Period Verification Activity */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Verification Activity This Period</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">{analytics.verifications.newBusinessRequests}</div>
                  <div className="text-xs text-gray-500">New Business Requests</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">{analytics.verifications.newIndividualRequests}</div>
                  <div className="text-xs text-gray-500">New Individual Requests</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">{analytics.verifications.approvedBusinessInPeriod}</div>
                  <div className="text-xs text-green-600">Business Approved</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">{analytics.verifications.approvedIndividualInPeriod}</div>
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
                      ? ((analytics.overview.activeAds / analytics.overview.totalAds) * 100).toFixed(1)
                      : 0}% of ads are currently active.
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
                    {analytics.verifications.approvedBusiness + analytics.verifications.approvedIndividual} verified
                    sellers on the platform.
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
