'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: number | null;
  deletion_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  category_name: string;
  location_name: string;
  seller_name: string;
  seller_email: string;
  reviewer_name: string | null;
  deleted_by_name: string | null;
}

export default function AdManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams?.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const loadAds = useCallback(async () => {
    try {
      console.log('📢 [Ads] Loading ads with filters:', {
        status: statusFilter,
        search: searchQuery,
        page,
      });

      setLoading(true);

      const response = await apiClient.getEditorAds({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        location: locationFilter || undefined,
        page,
        limit: 20,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        includeDeleted: 'false',
      });

      console.log('📢 [Ads] Response:', response);

      if (response.success && response.data) {
        setAds(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalAds(response.data.pagination?.total || 0);
      }

      setLoading(false);
      console.log('✅ [Ads] Loaded successfully');
    } catch (error) {
      console.error('❌ [Ads] Error loading ads:', error);
      setLoading(false);
    }
  }, [statusFilter, searchQuery, categoryFilter, locationFilter, page]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadAds();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadAds]);

  const handleApprove = async (adId: number) => {
    if (!confirm('Are you sure you want to approve this ad?')) return;

    try {
      console.log(`✅ [Ads] Approving ad #${adId}...`);
      setActionLoading(adId);

      // Note: Using editor endpoint which should also work for super admin
      const response = await apiClient.approveAd(adId);

      if (response.success) {
        console.log(`✅ [Ads] Ad #${adId} approved successfully`);
        loadAds(); // Reload the list
      }
    } catch (error: any) {
      console.error(`❌ [Ads] Error approving ad #${adId}:`, error);
      alert(error.response?.data?.message || 'Failed to approve ad');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (adId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      console.log(`❌ [Ads] Rejecting ad #${adId} with reason:`, reason);
      setActionLoading(adId);

      const response = await apiClient.rejectAd(adId, reason);

      if (response.success) {
        console.log(`❌ [Ads] Ad #${adId} rejected successfully`);
        loadAds(); // Reload the list
      }
    } catch (error: any) {
      console.error(`❌ [Ads] Error rejecting ad #${adId}:`, error);
      alert(error.response?.data?.message || 'Failed to reject ad');
    } finally {
      setActionLoading(null);
    }
  };

  const navSections = getSuperAdminNavSections(params.lang);

  // Count ads by status
  const pendingCount = ads.filter((ad) => ad.status === 'pending').length;
  const approvedCount = ads.filter((ad) => ad.status === 'approved').length;
  const rejectedCount = ads.filter((ad) => ad.status === 'rejected').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading ads...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      systemAlert={{ message: 'Storage: 86% used', type: 'warning' }}
      notificationCount={5}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ad Management
            </h1>
            <p className="text-gray-600 text-lg">
              Review, approve, reject, and manage all advertisements on the platform
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">📢</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{totalAds}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Total Ads</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">⏳</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{pendingCount}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Pending Review</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border-2 border-emerald-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">✅</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{approvedCount}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Approved</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border-2 border-rose-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">❌</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{rejectedCount}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadAds()}
              placeholder="Search ads by title or description..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>

          <button
            onClick={() => loadAds()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Ad Details</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Seller</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Price</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Created</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg">No ads found</div>
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">{ad.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">{ad.description}</div>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {ad.category_name}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {ad.location_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{ad.seller_name}</div>
                        <div className="text-gray-500">{ad.seller_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        NPR {ad.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          ad.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : ad.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(ad.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id)}
                              disabled={actionLoading === ad.id}
                              className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === ad.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(ad.id)}
                              disabled={actionLoading === ad.id}
                              className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === ad.id ? '...' : 'Reject'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => window.open(`/${params.lang}/ad/${ad.id}`, '_blank')}
                          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages} ({totalAds} total ads)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
