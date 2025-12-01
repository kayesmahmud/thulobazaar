'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface AnalyticsData {
  overview: {
    totalAdsReviewed: number;
    totalAdsApproved: number;
    totalAdsRejected: number;
    totalVerifications: number;
    avgResponseTime: number;
    approvalRate: number;
  };
  dailyStats: {
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
  editorPerformance: {
    name: string;
    reviewed: number;
    approved: number;
    rejected: number;
    avgTime: number;
  }[];
  rejectionReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  hourlyActivity: {
    hour: number;
    count: number;
  }[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function ModerationAnalyticsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      totalAdsReviewed: 1247,
      totalAdsApproved: 1089,
      totalAdsRejected: 158,
      totalVerifications: 234,
      avgResponseTime: 2.4,
      approvalRate: 87.3,
    },
    dailyStats: [
      { date: '2024-01-15', approved: 45, rejected: 8, pending: 12 },
      { date: '2024-01-16', approved: 52, rejected: 6, pending: 10 },
      { date: '2024-01-17', approved: 48, rejected: 9, pending: 15 },
      { date: '2024-01-18', approved: 55, rejected: 7, pending: 8 },
      { date: '2024-01-19', approved: 50, rejected: 10, pending: 11 },
      { date: '2024-01-20', approved: 42, rejected: 5, pending: 9 },
      { date: '2024-01-21', approved: 38, rejected: 4, pending: 7 },
    ],
    categoryBreakdown: [
      { category: 'Electronics', count: 342, percentage: 27.4 },
      { category: 'Vehicles', count: 256, percentage: 20.5 },
      { category: 'Real Estate', count: 189, percentage: 15.2 },
      { category: 'Fashion', count: 167, percentage: 13.4 },
      { category: 'Home & Garden', count: 145, percentage: 11.6 },
      { category: 'Others', count: 148, percentage: 11.9 },
    ],
    editorPerformance: [
      { name: 'Editor Admin', reviewed: 456, approved: 398, rejected: 58, avgTime: 2.1 },
      { name: 'Editor User', reviewed: 389, approved: 342, rejected: 47, avgTime: 2.5 },
      { name: 'Editor Moderator', reviewed: 402, approved: 349, rejected: 53, avgTime: 2.3 },
    ],
    rejectionReasons: [
      { reason: 'Inappropriate Content', count: 45, percentage: 28.5 },
      { reason: 'Duplicate Listing', count: 38, percentage: 24.1 },
      { reason: 'Poor Quality Images', count: 32, percentage: 20.3 },
      { reason: 'Misleading Information', count: 25, percentage: 15.8 },
      { reason: 'Prohibited Items', count: 18, percentage: 11.4 },
    ],
    hourlyActivity: [
      { hour: 0, count: 12 },
      { hour: 1, count: 8 },
      { hour: 2, count: 5 },
      { hour: 3, count: 3 },
      { hour: 4, count: 4 },
      { hour: 5, count: 7 },
      { hour: 6, count: 15 },
      { hour: 7, count: 28 },
      { hour: 8, count: 45 },
      { hour: 9, count: 62 },
      { hour: 10, count: 78 },
      { hour: 11, count: 85 },
      { hour: 12, count: 72 },
      { hour: 13, count: 68 },
      { hour: 14, count: 80 },
      { hour: 15, count: 75 },
      { hour: 16, count: 65 },
      { hour: 17, count: 58 },
      { hour: 18, count: 48 },
      { hour: 19, count: 35 },
      { hour: 20, count: 28 },
      { hour: 21, count: 22 },
      { hour: 22, count: 18 },
      { hour: 23, count: 15 },
    ],
  });

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, params.lang, router]);

  const getMaxValue = (data: number[]) => Math.max(...data);

  const renderBarChart = (data: { label: string; value: number; color: string }[]) => {
    const maxValue = getMaxValue(data.map((d) => d.value));
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="text-gray-600">{item.value}</span>
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

  const renderLineChart = (data: { date: string; approved: number; rejected: number }[]) => {
    const maxValue = getMaxValue([
      ...data.map((d) => d.approved),
      ...data.map((d) => d.rejected),
    ]);
    const chartHeight = 200;

    return (
      <div className="relative">
        <div className="flex items-end justify-between h-[200px] px-2">
          {data.map((item, index) => {
            const approvedHeight = (item.approved / maxValue) * chartHeight;
            const rejectedHeight = (item.rejected / maxValue) * chartHeight;
            return (
              <div key={index} className="flex flex-col items-center flex-1 gap-1">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div
                    className="bg-green-500 rounded-t w-6 transition-all duration-500 hover:bg-green-600"
                    style={{ height: `${approvedHeight}px` }}
                    title={`Approved: ${item.approved}`}
                  />
                  <div
                    className="bg-red-500 rounded-t w-6 transition-all duration-500 hover:bg-red-600"
                    style={{ height: `${rejectedHeight}px` }}
                    title={`Rejected: ${item.rejected}`}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm text-gray-600">Rejected</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPieChart = (data: { category: string; percentage: number; color: string }[]) => {
    return (
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.reduce((acc, item, index) => {
              const startAngle = acc.angle;
              const angle = (item.percentage / 100) * 360;
              const endAngle = startAngle + angle;
              const largeArcFlag = angle > 180 ? 1 : 0;

              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

              const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              acc.paths.push(
                <path
                  key={index}
                  d={path}
                  fill={item.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={() => alert(`${item.category}: ${item.percentage}%`)}
                />
              );

              acc.angle = endAngle;
              return acc;
            }, { paths: [] as React.JSX.Element[], angle: 0 }).paths}
          </svg>
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${item.color}`} />
              <span className="text-sm text-gray-700">
                {item.category} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeatmap = (data: { hour: number; count: number }[]) => {
    const maxValue = getMaxValue(data.map((d) => d.count));
    return (
      <div className="grid grid-cols-12 gap-2">
        {data.map((item) => {
          const intensity = (item.count / maxValue) * 100;
          const bgColor =
            intensity > 75
              ? 'bg-teal-700'
              : intensity > 50
              ? 'bg-teal-500'
              : intensity > 25
              ? 'bg-teal-300'
              : 'bg-teal-100';
          return (
            <div
              key={item.hour}
              className={`${bgColor} rounded p-2 text-center transition-all hover:scale-110 cursor-pointer`}
              title={`${item.hour}:00 - ${item.count} activities`}
            >
              <div className="text-xs font-bold text-white">{item.hour}</div>
              <div className="text-xs text-white opacity-90">{item.count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moderation Analytics</h1>
            <p className="text-gray-600 mt-1">Insights and statistics about moderation activities</p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Total Reviewed</div>
                <div className="text-3xl font-bold text-blue-900">
                  {analytics.overview.totalAdsReviewed.toLocaleString()}
                </div>
                <div className="text-xs text-blue-600 mt-1">Ads moderated</div>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">Approval Rate</div>
                <div className="text-3xl font-bold text-green-900">
                  {analytics.overview.approvalRate}%
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {analytics.overview.totalAdsApproved.toLocaleString()} approved
                </div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Rejected</div>
                <div className="text-3xl font-bold text-red-900">
                  {analytics.overview.totalAdsRejected.toLocaleString()}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {((analytics.overview.totalAdsRejected / analytics.overview.totalAdsReviewed) * 100).toFixed(1)}% rejection rate
                </div>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-1">Verifications</div>
                <div className="text-3xl font-bold text-purple-900">
                  {analytics.overview.totalVerifications.toLocaleString()}
                </div>
                <div className="text-xs text-purple-600 mt-1">Processed</div>
              </div>
              <div className="text-4xl">🪪</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-teal-700 mb-1">Avg Response Time</div>
                <div className="text-3xl font-bold text-teal-900">
                  {analytics.overview.avgResponseTime}h
                </div>
                <div className="text-xs text-teal-600 mt-1">Per review</div>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700 mb-1">Active Editors</div>
                <div className="text-3xl font-bold text-orange-900">
                  {analytics.editorPerformance.length}
                </div>
                <div className="text-xs text-orange-600 mt-1">Team members</div>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>
        </div>

        {/* Daily Activity Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Activity Trend</h3>
          <p className="text-sm text-gray-600 mb-6">
            Approved vs Rejected ads over the last 7 days
          </p>
          {renderLineChart(analytics.dailyStats)}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Category Distribution</h3>
            <p className="text-sm text-gray-600 mb-6">Ads reviewed by category</p>
            {renderPieChart(
              analytics.categoryBreakdown.map((cat, index) => ({
                category: cat.category,
                percentage: cat.percentage,
                color: [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-purple-500',
                  'bg-orange-500',
                  'bg-teal-500',
                  'bg-pink-500',
                ][index] || 'bg-gray-500',
              }))
            )}
          </div>

          {/* Rejection Reasons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Top Rejection Reasons</h3>
            <p className="text-sm text-gray-600 mb-6">Most common reasons for ad rejection</p>
            {renderBarChart(
              analytics.rejectionReasons.map((reason) => ({
                label: reason.reason,
                value: reason.count,
                color: 'bg-red-500',
              }))
            )}
          </div>
        </div>

        {/* Editor Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Editor Performance</h3>
          <p className="text-sm text-gray-600 mb-6">Individual editor statistics</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Editor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reviewed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Approved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rejected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Approval Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.editorPerformance.map((editor, index) => {
                  const approvalRate = ((editor.approved / editor.reviewed) * 100).toFixed(1);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-lg font-semibold text-teal-700">
                              {editor.name.charAt(0)}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900">{editor.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editor.reviewed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {editor.approved}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {editor.rejected}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {approvalRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editor.avgTime}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hourly Activity Heatmap */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hourly Activity Heatmap</h3>
          <p className="text-sm text-gray-600 mb-6">
            Moderation activity by hour of day (0-23)
          </p>
          {renderHeatmap(analytics.hourlyActivity)}
          <div className="flex items-center justify-center gap-2 mt-6">
            <span className="text-sm text-gray-600">Low</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 bg-teal-100 rounded" />
              <div className="w-6 h-6 bg-teal-300 rounded" />
              <div className="w-6 h-6 bg-teal-500 rounded" />
              <div className="w-6 h-6 bg-teal-700 rounded" />
            </div>
            <span className="text-sm text-gray-600">High</span>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <span>💡</span> Insights & Recommendations
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Peak Activity Hours</div>
                  <div className="text-sm text-gray-600">
                    Most ads are submitted between 9 AM - 3 PM. Consider having more editors
                    available during these hours.
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Response Time</div>
                  <div className="text-sm text-gray-600">
                    Current average response time is {analytics.overview.avgResponseTime}h. Aim to
                    keep it under 2 hours for better user satisfaction.
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Approval Rate</div>
                  <div className="text-sm text-gray-600">
                    Your approval rate of {analytics.overview.approvalRate}% is healthy. Consistent
                    rates indicate clear moderation guidelines.
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
