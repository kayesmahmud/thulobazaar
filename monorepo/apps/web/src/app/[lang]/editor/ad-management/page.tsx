'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getAds, approveAd, rejectAd, deleteAd } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  sellerName?: string;
  sellerPhone?: string;
  condition?: string;
  statusReason?: string;
}

type TabStatus = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await getAds({
        status,
        search: searchTerm || undefined,
        page,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (response.success && Array.isArray(response.data)) {
        setAds(response.data);
        // Calculate total pages (if backend doesn't provide it)
        setTotalPages(Math.max(1, Math.ceil(response.data.length / 10)));
      } else {
        setAds([]);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, page]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadAds();
  }, [authLoading, staff, isEditor, params.lang, router, loadAds]);

  const handleApprove = async (adId: number) => {
    if (!confirm('Are you sure you want to approve this ad?')) return;

    try {
      setActionLoading(true);
      const response = await approveAd(adId);

      if (response.success) {
        alert('Ad approved successfully!');
        loadAds();
        setSelectedAd(null);
      } else {
        alert('Failed to approve ad');
      }
    } catch (error) {
      console.error('Error approving ad:', error);
      alert('Error approving ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAd || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await rejectAd(selectedAd.id, rejectReason);

      if (response.success) {
        alert('Ad rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        loadAds();
        setSelectedAd(null);
      } else {
        alert('Failed to reject ad');
      }
    } catch (error) {
      console.error('Error rejecting ad:', error);
      alert('Error rejecting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (adId: number) => {
    if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) return;

    try {
      setActionLoading(true);
      const response = await deleteAd(adId, 'Deleted by editor');

      if (response.success) {
        alert('Ad deleted successfully!');
        loadAds();
        setSelectedAd(null);
      } else {
        alert('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200';
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
            <div className="text-lg font-semibold text-gray-700">Loading ads...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Ad Management</h1>
            <p className="text-gray-600 mt-1">Review and manage classified ads</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1">
          {(['all', 'pending', 'approved', 'rejected'] as TabStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search ads by title, description, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  loadAds();
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                setPage(1);
                loadAds();
              }}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Search
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Ads List */}
        <div className="space-y-4">
          {ads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : `No ${activeTab === 'all' ? '' : activeTab} ads at the moment`}
              </p>
            </div>
          ) : (
            ads.map((ad) => (
              <div
                key={ad.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Ad Image */}
                    <div className="flex-shrink-0">
                      {ad.images && ad.images.length > 0 ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/ads/${ad.images[0]}`}
                          alt={ad.title}
                          className="w-48 h-36 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-48 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">📷</span>
                        </div>
                      )}
                    </div>

                    {/* Ad Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ad.status)}`}>
                              {ad.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>🏷️</span> {ad.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📍</span> {ad.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>💰</span> NPR {ad.price?.toLocaleString()}
                            </span>
                            {ad.condition && (
                              <span className="flex items-center gap-1">
                                <span>📦</span> {ad.condition}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>ID: #{ad.id}</div>
                          <div className="mt-1">
                            {new Date(ad.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Seller Info */}
                      {ad.sellerName && (
                        <div className="mb-3 text-sm text-gray-600">
                          <span className="font-medium">Seller:</span> {ad.sellerName}
                          {ad.sellerPhone && <span className="ml-2">📞 {ad.sellerPhone}</span>}
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {ad.status === 'rejected' && ad.statusReason && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                          <span className="font-medium">Rejection Reason:</span> {ad.statusReason}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => window.open(`/${params.lang}/ad/${ad.id}`, '_blank')}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          👁️ View Details
                        </button>

                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAd(ad);
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(ad.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {ads.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Ad</h3>
            <p className="text-gray-600 mb-4">
              You are about to reject: <strong>{selectedAd.title}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedAd(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
