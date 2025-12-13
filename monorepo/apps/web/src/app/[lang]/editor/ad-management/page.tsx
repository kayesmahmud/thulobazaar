'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getAds } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/navigation';
import { useAdActions } from '@/hooks/useAdActions';
import { RejectAdModal, SuspendAdModal, PermanentDeleteAdModal } from '@/components/editor';
import { getStatusBadge, getAvailableActions } from '@/utils/editorUtils';
import {
  CheckCircle,
  XCircle,
  Clock,
  PauseCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Eye,
} from 'lucide-react';

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
  deletedAt?: string | null;
  images?: string[];
  sellerName?: string;
  sellerPhone?: string;
  condition?: string;
  statusReason?: string;
  suspendedUntil?: string | null;
  slug?: string;
}

// Transform API response (snake_case) to component format (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAd(ad: any): Ad {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    category: ad.category_name || ad.category || '',
    location: ad.location_name || ad.location || '',
    status: ad.status,
    createdAt: ad.created_at || ad.createdAt,
    updatedAt: ad.updated_at || ad.updatedAt,
    deletedAt: ad.deleted_at || ad.deletedAt,
    images: ad.images || [],
    sellerName: ad.seller_name || ad.sellerName,
    sellerPhone: ad.seller_phone || ad.sellerPhone,
    condition: ad.condition,
    statusReason: ad.status_reason || ad.statusReason,
    suspendedUntil: ad.suspended_until || ad.suspendedUntil,
    slug: ad.slug,
  };
}

type TabStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted' | 'all';

export default function AdManagementPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, logout } = useStaffAuth();

  // State
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadAds = useCallback(async () => {
    try {
      setLoading(true);
      const includeDeleted = activeTab === 'deleted' ? 'only' : activeTab === 'all' ? 'true' : 'false';
      const status = activeTab === 'all' || activeTab === 'deleted' ? undefined : activeTab;

      const response = await getAds({
        status,
        includeDeleted,
        search: searchTerm || undefined,
        page,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (response.success && response.data) {
        setAds(response.data.map(transformAd));
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, page]);

  const actions = useAdActions(loadAds);

  useEffect(() => {
    if (staff) {
      loadAds();
    }
  }, [staff, loadAds]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  // Modal handlers
  const openRejectModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowRejectModal(true);
  };

  const openSuspendModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowSuspendModal(true);
  };

  const openPermanentDeleteModal = (ad: Ad) => {
    setSelectedAd(ad);
    setShowPermanentDeleteModal(true);
  };

  const closeModals = () => {
    setShowRejectModal(false);
    setShowSuspendModal(false);
    setShowPermanentDeleteModal(false);
    setSelectedAd(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-10 h-10 text-white" />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1 flex-wrap">
          {(['pending', 'approved', 'rejected', 'suspended', 'deleted', 'all'] as TabStatus[]).map((tab) => {
            const tabConfig = {
              pending: { icon: <Clock size={16} />, color: 'yellow' },
              approved: { icon: <CheckCircle size={16} />, color: 'green' },
              rejected: { icon: <XCircle size={16} />, color: 'red' },
              suspended: { icon: <PauseCircle size={16} />, color: 'orange' },
              deleted: { icon: <Trash2 size={16} />, color: 'gray' },
              all: { icon: null, color: 'blue' },
            };

            const config = tabConfig[tab];
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? `bg-${config.color}-500 text-white shadow-md`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {config.icon}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ads by title, description, seller..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
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
            ads.map((ad) => {
              const availableActions = getAvailableActions(ad);

              return (
                <div
                  key={ad.id}
                  className={`bg-white rounded-xl shadow-sm border transition-shadow ${
                    ad.deletedAt ? 'border-gray-400 opacity-75' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex gap-6">
                      {/* Ad Image */}
                      <div className="flex-shrink-0">
                        {ad.images && ad.images.length > 0 ? (
                          <img
                            src={`/${ad.images[0]}`}
                            alt={ad.title}
                            className="w-48 h-36 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-48 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-4xl">📷</span>
                          </div>
                        )}
                      </div>

                      {/* Ad Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ad.status)}`}>
                                {ad.status.toUpperCase()}
                              </span>
                              {ad.deletedAt && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200">
                                  DELETED
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">🏷️ {ad.category}</span>
                              <span className="flex items-center gap-1">📍 {ad.location}</span>
                              <span className="flex items-center gap-1">💰 NPR {ad.price?.toLocaleString()}</span>
                              {ad.condition && <span className="flex items-center gap-1">📦 {ad.condition}</span>}
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

                        {/* Status Messages */}
                        {ad.status === 'rejected' && ad.statusReason && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                            <span className="font-medium">Rejection Reason:</span> {ad.statusReason}
                          </div>
                        )}

                        {ad.status === 'suspended' && ad.statusReason && (
                          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                            <span className="font-medium">Suspension Reason:</span> {ad.statusReason}
                            {ad.suspendedUntil && (
                              <div className="mt-1">
                                <span className="font-medium">Suspended Until:</span>{' '}
                                {new Date(ad.suspendedUntil).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}

                        {ad.deletedAt && (
                          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                            <span className="font-medium">Deleted At:</span>{' '}
                            {new Date(ad.deletedAt).toLocaleDateString()}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4 flex-wrap">
                          <button
                            onClick={() => window.open(`/${params.lang}/ad/${ad.slug}`, '_blank')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <Eye size={16} />
                            View Details
                          </button>

                          {availableActions.includes('approve') && (
                            <button
                              onClick={() => actions.handleApprove(ad.id)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                          )}

                          {availableActions.includes('reject') && (
                            <button
                              onClick={() => openRejectModal(ad)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          )}

                          {availableActions.includes('suspend') && (
                            <button
                              onClick={() => openSuspendModal(ad)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <PauseCircle size={16} />
                              Suspend
                            </button>
                          )}

                          {availableActions.includes('unsuspend') && (
                            <button
                              onClick={() => actions.handleUnsuspend(ad.id)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <RotateCcw size={16} />
                              Unsuspend
                            </button>
                          )}

                          {availableActions.includes('restore') && (
                            <button
                              onClick={() => actions.handleRestore(ad.id)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <RotateCcw size={16} />
                              Restore
                            </button>
                          )}

                          {availableActions.includes('delete') && (
                            <button
                              onClick={() => actions.handleDelete(ad.id)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          )}

                          {availableActions.includes('permanentDelete') && (
                            <button
                              onClick={() => openPermanentDeleteModal(ad)}
                              disabled={actions.loading}
                              className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-950 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              <AlertTriangle size={16} />
                              Delete Forever
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRejectModal && selectedAd && (
        <RejectAdModal
          adTitle={selectedAd.title}
          onConfirm={async (reason) => {
            await actions.handleReject(selectedAd.id, reason);
            closeModals();
          }}
          onCancel={closeModals}
        />
      )}

      {showSuspendModal && selectedAd && (
        <SuspendAdModal
          adTitle={selectedAd.title}
          onConfirm={async (reason, duration) => {
            await actions.handleSuspend(selectedAd.id, reason, duration);
            closeModals();
          }}
          onCancel={closeModals}
        />
      )}

      {showPermanentDeleteModal && selectedAd && (
        <PermanentDeleteAdModal
          adTitle={selectedAd.title}
          onConfirm={async (reason) => {
            await actions.handlePermanentDelete(selectedAd.id, reason);
            closeModals();
          }}
          onCancel={closeModals}
        />
      )}
    </DashboardLayout>
  );
}
