'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  statusReason?: string;
  slug: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  deletedAt?: string;
  categoryId: number;
  locationId: number;
  categoryName?: string;
  locationName?: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    accountType: string;
    businessVerified: boolean;
    individualVerified: boolean;
  };
  primaryImage?: string;
}

type TabStatus = 'all' | 'approved' | 'pending' | 'suspended' | 'rejected' | 'deleted';

interface SuspendModalData {
  ad: Ad;
  reason: string;
}

interface DeleteModalData {
  ad: Ad;
  reason: string;
}

export default function AdsListPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modals
  const [suspendModal, setSuspendModal] = useState<SuspendModalData | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalData | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;

      // Determine status and includeDeleted parameters
      let statusParam = 'all';
      let includeDeleted = 'false';

      if (activeTab === 'deleted') {
        // Show ONLY deleted ads (any status, but deleted_at IS NOT NULL)
        statusParam = 'all';
        includeDeleted = 'only'; // New value: only show deleted ads
      } else if (activeTab === 'all') {
        // Show all NON-deleted ads (all statuses, but deleted_at IS NULL)
        statusParam = 'all';
        includeDeleted = 'false';
      } else {
        // Show specific status (approved, pending, suspended, rejected) and non-deleted
        statusParam = activeTab;
        includeDeleted = 'false';
      }

      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads?status=${statusParam}&includeDeleted=${includeDeleted}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setAds(data.data);
        setTotal(data.pagination?.total || data.data.length);
      } else {
        setAds([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setAds([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadAds();
  }, [authLoading, staff, isEditor, params.lang, router, loadAds]);

  const handleSuspend = async () => {
    if (!suspendModal || !suspendModal.reason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${suspendModal.ad.id}/suspend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: suspendModal.reason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad suspended successfully!');
        setSuspendModal(null);
        loadAds();
      } else {
        alert(data.message || 'Failed to suspend ad');
      }
    } catch (error) {
      console.error('Error suspending ad:', error);
      alert('Error suspending ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (adId: number) => {
    if (!confirm('Are you sure you want to unsuspend this ad?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${adId}/unsuspend`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad unsuspended successfully!');
        loadAds();
      } else {
        alert(data.message || 'Failed to unsuspend ad');
      }
    } catch (error) {
      console.error('Error unsuspending ad:', error);
      alert('Error unsuspending ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (adId: number) => {
    if (!confirm('Are you sure you want to restore this ad?')) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${adId}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad restored successfully!');
        loadAds();
      } else {
        alert(data.message || 'Failed to restore ad');
      }
    } catch (error) {
      console.error('Error restoring ad:', error);
      alert('Error restoring ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async (adId: number, adTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${adTitle}"? This can be restored later.`)) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${adId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: 'Soft deleted by editor' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad deleted successfully (can be restored)');
        loadAds();
      } else {
        alert(data.message || 'Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteModal) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('editorToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/editor/ads/${deleteModal.ad.id}/permanent`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: deleteModal.reason || 'Permanently deleted by editor' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Ad permanently deleted! This action cannot be undone.');
        setDeleteModal(null);
        loadAds();
      } else {
        alert(data.message || 'Failed to permanently delete ad');
      }
    } catch (error) {
      console.error('Error permanently deleting ad:', error);
      alert('Error permanently deleting ad');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, deletedAt?: string) => {
    if (deletedAt) {
      return 'bg-black text-white border-black';
    }
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      suspended: 'bg-orange-100 text-orange-800 border-orange-200',
      deleted: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (ad: Ad) => {
    if (ad.deletedAt) return '🗑️ DELETED';
    if (ad.status === 'suspended') return '⏸️ SUSPENDED';
    if (ad.status === 'approved') return '✅ APPROVED';
    if (ad.status === 'pending') return '⏳ PENDING';
    if (ad.status === 'rejected') return '❌ REJECTED';
    return ad.status.toUpperCase();
  };

  const totalPages = Math.ceil(total / limit);

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
            <h1 className="text-3xl font-bold text-gray-900">📋 All Ads Management</h1>
            <p className="text-gray-600 mt-1">Manage all ads: suspend, restore, or permanently delete</p>
          </div>
          <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
            Total: <span className="font-bold text-gray-900">{total}</span> ads
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex flex-wrap gap-1">
          {(['all', 'approved', 'pending', 'suspended', 'rejected', 'deleted'] as TabStatus[]).map((tab) => (
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
              {tab === 'all' && '📊 All'}
              {tab === 'approved' && '✅ Approved'}
              {tab === 'pending' && '⏳ Pending'}
              {tab === 'suspended' && '⏸️ Suspended'}
              {tab === 'rejected' && '❌ Rejected'}
              {tab === 'deleted' && '🗑️ Deleted'}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search ads by title, ID, or user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                setPage(1);
                loadAds();
              }}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              🔍 Search
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
                className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow ${
                  ad.deletedAt ? 'border-black opacity-75' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Ad Image */}
                    <div className="flex-shrink-0">
                      {ad.primaryImage ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/ads/${ad.primaryImage}`}
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
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ad.status, ad.deletedAt)}`}>
                              {getStatusLabel(ad)}
                            </span>
                          </div>
                          <p className="text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <span>🆔</span> ID: {ad.id}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🏷️</span> {ad.categoryName || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📍</span> {ad.locationName || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>💰</span> NPR {ad.price?.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📦</span> {ad.condition}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>👁️</span> {ad.viewCount} views
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="mb-1">
                            {new Date(ad.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          {ad.deletedAt && (
                            <div className="text-xs text-red-600 font-semibold">
                              Deleted: {new Date(ad.deletedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* User Info */}
                      {ad.user && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">User:</span>
                            <span>{ad.user.fullName}</span>
                            <span className="text-gray-500">({ad.user.email})</span>
                            {ad.user.businessVerified && <span className="text-blue-600">✓ Business</span>}
                            {ad.user.individualVerified && <span className="text-green-600">✓ Individual</span>}
                          </div>
                        </div>
                      )}

                      {/* Status Reason */}
                      {ad.statusReason && (
                        <div className={`mb-3 p-3 border rounded-lg text-sm ${
                          ad.status === 'suspended'
                            ? 'bg-orange-50 border-orange-200 text-orange-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <span className="font-medium">Reason:</span> {ad.statusReason}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <button
                          onClick={() => window.open(`/${params.lang}/ad/${ad.slug || ad.id}`, '_blank')}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          👁️ View
                        </button>

                        {/* Suspend Button (for non-suspended, non-deleted ads) */}
                        {ad.status !== 'suspended' && !ad.deletedAt && (
                          <button
                            onClick={() => setSuspendModal({ ad, reason: '' })}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
                          >
                            ⏸️ Suspend
                          </button>
                        )}

                        {/* Unsuspend Button (for suspended ads) */}
                        {ad.status === 'suspended' && !ad.deletedAt && (
                          <button
                            onClick={() => handleUnsuspend(ad.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                          >
                            ▶️ Unsuspend
                          </button>
                        )}

                        {/* Restore Button (for deleted ads) */}
                        {ad.deletedAt && (
                          <button
                            onClick={() => handleRestore(ad.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                          >
                            ♻️ Restore
                          </button>
                        )}

                        {/* Soft Delete Button (for non-deleted ads) */}
                        {!ad.deletedAt && (
                          <button
                            onClick={() => handleSoftDelete(ad.id, ad.title)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            🗑️ Delete
                          </button>
                        )}

                        {/* Permanent Delete Button (always shown) */}
                        <button
                          onClick={() => setDeleteModal({ ad, reason: '' })}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
                        >
                          ❌ Delete Forever
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

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">⏸️ Suspend Ad</h3>
            <p className="text-gray-600 mb-4">
              You are about to suspend: <strong>{suspendModal.ad.title}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for suspension</label>
              <select
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-2"
              >
                <option value="">Select a reason...</option>
                <option value="Spam content">Spam content</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Violation of terms">Violation of terms</option>
                <option value="Reported by users">Reported by users</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                placeholder="Or enter custom reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSuspendModal(null)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading || !suspendModal.reason.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Suspending...' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-4 border-red-500">
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              ⚠️ PERMANENT DELETE - Cannot Be Undone!
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">
                You are about to PERMANENTLY delete:
              </p>
              <p className="text-red-900 font-bold">{deleteModal.ad.title}</p>
              <p className="text-red-700 text-sm mt-2">
                This will remove all data including images and cannot be restored!
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for permanent deletion (optional)</label>
              <textarea
                value={deleteModal.reason}
                onChange={(e) => setDeleteModal({ ...deleteModal, reason: e.target.value })}
                placeholder="Enter reason for audit log..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                {actionLoading ? 'Deleting...' : 'DELETE FOREVER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
