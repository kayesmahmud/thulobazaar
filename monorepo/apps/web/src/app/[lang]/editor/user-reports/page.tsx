'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getUserReportsList } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface UserReport {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_until: string | null;
  suspension_reason: string | null;
  suspended_by_name: string | null;
  business_verification_status: string;
  business_verification_reason: string | null;
  created_at: string;
  shop_slug: string | null;
  ad_count: number;
}

export default function UserReportsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'suspended' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUserReportsList(undefined, {
        page,
        limit: 20,
        type: typeFilter,
        search: searchTerm,
      });

      if (response.success) {
        setReports(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalCount(response.pagination.total);
        }
      }
    } catch (error) {
      console.error('Error loading user reports:', error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, searchTerm]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadReports();
  }, [authLoading, staff, isEditor, params.lang, router, loadReports]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const getIssueType = (report: UserReport) => {
    if (report.is_suspended) return 'suspended';
    if (report.business_verification_status === 'rejected') return 'rejected';
    return 'unknown';
  };

  const getIssueBadge = (report: UserReport) => {
    const type = getIssueType(report);
    if (type === 'suspended') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (loading && reports.length === 0) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName || 'Editor'}
        userEmail={staff?.email || ''}
        navSections={getEditorNavSections(params.lang)}
        theme="editor"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor'}
      userEmail={staff?.email || ''}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Reports</h1>
            <p className="text-gray-600 mt-1">Manage problematic users and review issues</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Total Reports</div>
                <div className="text-3xl font-bold text-red-900">{totalCount}</div>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700 mb-1">Suspended Users</div>
                <div className="text-3xl font-bold text-orange-900">
                  {reports.filter(r => r.is_suspended).length}
                </div>
              </div>
              <div className="text-4xl">🚫</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-700 mb-1">Rejected Verifications</div>
                <div className="text-3xl font-bold text-yellow-900">
                  {reports.filter(r => r.business_verification_status === 'rejected').length}
                </div>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Issues</option>
              <option value="suspended">Suspended Only</option>
              <option value="rejected">Rejected Verifications Only</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || typeFilter !== 'all'
                        ? 'No reports found matching your filters'
                        : 'No user reports found'}
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-red-700">
                              {report.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{report.full_name}</div>
                            <div className="text-sm text-gray-500">{report.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getIssueBadge(report)}`}>
                          {report.is_suspended ? '🚫 Suspended' : '❌ Rejected Verification'}
                        </span>
                        {report.is_suspended && report.suspended_until && (
                          <div className="text-xs text-red-600 mt-1">
                            Until: {new Date(report.suspended_until).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs">
                          {report.is_suspended && report.suspension_reason && (
                            <div className="text-gray-700 bg-red-50 p-2 rounded border border-red-200">
                              <span className="font-semibold">Suspension:</span> {report.suspension_reason}
                              {report.suspended_by_name && (
                                <div className="text-xs text-gray-600 mt-1">
                                  By: {report.suspended_by_name}
                                </div>
                              )}
                            </div>
                          )}
                          {report.business_verification_status === 'rejected' && report.business_verification_reason && (
                            <div className="text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                              <span className="font-semibold">Rejection:</span> {report.business_verification_reason}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            {report.ad_count} active ads
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.suspended_at
                          ? new Date(report.suspended_at).toLocaleDateString()
                          : new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => router.push(`/${params.lang}/editor/user-management`)}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          Manage
                        </button>
                        {report.shop_slug && (
                          <button
                            onClick={() => window.open(`/${params.lang}/shop/${report.shop_slug}`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Shop
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages} ({totalCount} total reports)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
