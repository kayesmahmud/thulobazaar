'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getVerifications,
  approveIndividualVerification,
  rejectIndividualVerification,
} from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface IndividualVerification {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  verifiedSellerName?: string;
  phone?: string;
  location?: string;
  status: string;
  submittedAt: string;
  type: string;
  // Shop slug for viewing user's shop
  shopSlug?: string;
  // Payment and duration fields
  durationDays?: number;
  paymentAmount?: number;
  paymentReference?: string;
  paymentStatus?: string;
  // Document fields
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentFront?: string;
  idDocumentBack?: string;
  selfieWithId?: string;
  // Rejection reason
  rejectionReason?: string;
}

export default function IndividualVerificationPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [verifications, setVerifications] = useState<IndividualVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<IndividualVerification | null>(
    null
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected' | 'approved'>('pending');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      // Use getVerifications with the active tab status and filter by individual type
      const response = await getVerifications(activeTab, 'individual');

      if (response.success && Array.isArray(response.data)) {
        // API already returns camelCase, so use camelCase field names
        const individualVerifications = response.data
          .map((v: any) => ({
            id: v.id,
            userId: v.userId,
            email: v.email || '',
            fullName: v.fullName || '',
            verifiedSellerName: v.verifiedSellerName,
            phone: v.phone,
            location: v.location,
            status: v.status,
            submittedAt: v.createdAt,
            type: v.type,
            // Shop slug for viewing user's shop
            shopSlug: v.shopSlug,
            // Payment and duration fields
            durationDays: v.durationDays,
            paymentAmount: v.paymentAmount,
            paymentReference: v.paymentReference,
            paymentStatus: v.paymentStatus,
            // Document fields
            idDocumentType: v.idDocumentType,
            idDocumentNumber: v.idDocumentNumber,
            idDocumentFront: v.idDocumentFront,
            idDocumentBack: v.idDocumentBack,
            selfieWithId: v.selfieWithId,
            // Rejection reason
            rejectionReason: v.rejectionReason,
          }));
        setVerifications(individualVerifications);
      } else {
        setVerifications([]);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    loadVerifications();
  }, [authLoading, staff, isEditor, params.lang, router, loadVerifications]);

  const handleApprove = async (verificationId: number) => {
    if (!confirm('Are you sure you want to approve this individual verification?')) return;

    try {
      setActionLoading(true);
      const response = await approveIndividualVerification(verificationId);

      if (response.success) {
        alert('Individual verification approved successfully!');
        loadVerifications();
        setSelectedVerification(null);
      } else {
        alert('Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Error approving verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await rejectIndividualVerification(
        selectedVerification.id,  // Use verification request ID, not userId
        rejectReason
      );

      if (response.success) {
        alert('Individual verification rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        loadVerifications();
        setSelectedVerification(null);
      } else {
        alert('Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Error rejecting verification');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredVerifications = verifications.filter((v) =>
    searchTerm
      ? v.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.verifiedSellerName?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

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
            <div className="text-lg font-semibold text-gray-700">Loading verifications...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Individual Verification</h1>
            <p className="text-gray-600 mt-1">
              Review and approve individual seller verification requests
            </p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>Pending</span>
                {activeTab === 'pending' && <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{verifications.length}</span>}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'rejected'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>Rejected</span>
                {activeTab === 'rejected' && <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{verifications.length}</span>}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'approved'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>Verified</span>
                {activeTab === 'approved' && <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{verifications.length}</span>}
              </span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`bg-gradient-to-br ${
            activeTab === 'pending' ? 'from-purple-50 to-purple-100 border-purple-200' :
            activeTab === 'rejected' ? 'from-red-50 to-red-100 border-red-200' :
            'from-green-50 to-green-100 border-green-200'
          } border-2 rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium mb-1 ${
                  activeTab === 'pending' ? 'text-purple-700' :
                  activeTab === 'rejected' ? 'text-red-700' :
                  'text-green-700'
                }`}>
                  {activeTab === 'pending' ? 'Total Pending' :
                   activeTab === 'rejected' ? 'Total Rejected' :
                   'Total Verified'}
                </div>
                <div className={`text-3xl font-bold ${
                  activeTab === 'pending' ? 'text-purple-900' :
                  activeTab === 'rejected' ? 'text-red-900' :
                  'text-green-900'
                }`}>
                  {filteredVerifications.length}
                </div>
              </div>
              <div className="text-4xl">
                {activeTab === 'pending' ? '🪪' :
                 activeTab === 'rejected' ? '❌' :
                 '✅'}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">With Phone</div>
                <div className="text-3xl font-bold text-blue-900">
                  {filteredVerifications.filter((v) => v.phone).length}
                </div>
              </div>
              <div className="text-4xl">📞</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-700 mb-1">
                  {activeTab === 'rejected' ? 'Recent Rejections' : 'Processing Time'}
                </div>
                <div className="text-3xl font-bold text-amber-900">
                  {activeTab === 'rejected' ? filteredVerifications.length : '1-2d'}
                </div>
              </div>
              <div className="text-4xl">{activeTab === 'rejected' ? '📋' : '⏱️'}</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <input
            type="text"
            placeholder="Search by name, email, or seller name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Verifications List */}
        <div className="space-y-4">
          {filteredVerifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' ? '🪪' :
                 activeTab === 'rejected' ? '📋' :
                 '✅'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending' ? 'No pending verifications' :
                 activeTab === 'rejected' ? 'No rejected verifications' :
                 'No verified users yet'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending' ? 'All individual verification requests have been processed' :
                 activeTab === 'rejected' ? 'No individual verification applications have been rejected' :
                 'No users have been verified through individual verification'}
              </p>
            </div>
          ) : (
            filteredVerifications.map((verification) => (
              <div
                key={verification.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-5xl">
                          {verification.fullName ? verification.fullName.charAt(0).toUpperCase() : '👤'}
                        </span>
                      </div>
                    </div>

                    {/* Verification Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {verification.fullName}
                          </h3>
                          {verification.verifiedSellerName && (
                            <div className="text-sm text-purple-700 font-medium mb-2 flex items-center gap-1">
                              <span>✨</span> Seller Name: {verification.verifiedSellerName}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span>📧</span> {verification.email}
                            </span>
                            {verification.phone && (
                              <span className="flex items-center gap-1">
                                <span>📞</span> {verification.phone}
                              </span>
                            )}
                            {verification.location && (
                              <span className="flex items-center gap-1">
                                <span>📍</span> {verification.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>User ID: #{verification.userId}</div>
                          <div className="mt-1">
                            {new Date(verification.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Payment & Duration Info */}
                      {(verification.durationDays || verification.paymentAmount !== undefined) && (
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                          {verification.durationDays && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-xs text-blue-600 font-medium mb-1">Duration</div>
                              <div className="text-lg font-bold text-blue-900">
                                {verification.durationDays === 30 ? '1 Month' :
                                 verification.durationDays === 90 ? '3 Months' :
                                 verification.durationDays === 180 ? '6 Months' :
                                 verification.durationDays === 365 ? '1 Year' :
                                 `${verification.durationDays} Days`}
                              </div>
                            </div>
                          )}
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-600 font-medium mb-1">Payment</div>
                            <div className="text-lg font-bold text-green-900">
                              {verification.paymentStatus === 'free' ? (
                                <span className="flex items-center gap-1">
                                  <span>FREE</span>
                                  <span className="text-xs font-normal">(Promo)</span>
                                </span>
                              ) : verification.paymentAmount !== undefined ? (
                                `NPR ${verification.paymentAmount}`
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </div>
                          {verification.paymentReference && (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="text-xs text-gray-600 font-medium mb-1">Reference</div>
                              <div className="text-sm font-mono text-gray-900 truncate" title={verification.paymentReference}>
                                {verification.paymentReference.substring(0, 20)}...
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ID Document Info */}
                      {(verification.idDocumentType || verification.idDocumentNumber) && (
                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span>ID Document Information</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {verification.idDocumentType && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Document Type</div>
                                <div className="font-medium text-gray-900 capitalize">
                                  {verification.idDocumentType.replace(/_/g, ' ')}
                                </div>
                              </div>
                            )}
                            {verification.idDocumentNumber && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Document Number</div>
                                <div className="font-medium text-gray-900 font-mono">
                                  {verification.idDocumentNumber}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Document Images */}
                      {(verification.idDocumentFront || verification.idDocumentBack || verification.selfieWithId) && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <span>Uploaded Documents</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {verification.idDocumentFront && (
                              <div>
                                <div className="text-xs text-blue-600 mb-2 font-medium">ID Front</div>
                                <a
                                  href={`/uploads/individual_verification/${verification.idDocumentFront}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block group"
                                >
                                  <div className="relative aspect-[4/3] bg-white border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                                    <img
                                      src={`/uploads/individual_verification/${verification.idDocumentFront}`}
                                      alt="ID Document Front"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                                        Click to view
                                      </span>
                                    </div>
                                  </div>
                                </a>
                              </div>
                            )}
                            {verification.idDocumentBack && (
                              <div>
                                <div className="text-xs text-blue-600 mb-2 font-medium">ID Back</div>
                                <a
                                  href={`/uploads/individual_verification/${verification.idDocumentBack}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block group"
                                >
                                  <div className="relative aspect-[4/3] bg-white border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                                    <img
                                      src={`/uploads/individual_verification/${verification.idDocumentBack}`}
                                      alt="ID Document Back"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                                        Click to view
                                      </span>
                                    </div>
                                  </div>
                                </a>
                              </div>
                            )}
                            {verification.selfieWithId && (
                              <div>
                                <div className="text-xs text-blue-600 mb-2 font-medium">Selfie with ID</div>
                                <a
                                  href={`/uploads/individual_verification/${verification.selfieWithId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block group"
                                >
                                  <div className="relative aspect-[4/3] bg-white border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                                    <img
                                      src={`/uploads/individual_verification/${verification.selfieWithId}`}
                                      alt="Selfie with ID"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                                        Click to view
                                      </span>
                                    </div>
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason (for rejected tab) */}
                      {activeTab === 'rejected' && verification.rejectionReason && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                            <div>
                              <div className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</div>
                              <div className="text-red-900">{verification.rejectionReason}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info Note */}
                      <div className={`mb-4 p-3 rounded-lg text-sm ${
                        activeTab === 'pending' ? 'bg-purple-50 border border-purple-200 text-purple-900' :
                        activeTab === 'rejected' ? 'bg-red-50 border border-red-200 text-red-900' :
                        'bg-green-50 border border-green-200 text-green-900'
                      }`}>
                        <span className="font-medium">Note:</span>{' '}
                        {activeTab === 'pending' ? 'Individual verification allows users to display a verified badge and build trust with buyers.' :
                         activeTab === 'rejected' ? 'This user can resubmit their verification with corrected information. They will appear in the Pending tab once resubmitted.' :
                         'This user has been verified and can display the verified badge on their profile and listings.'}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(verification.id)}
                              disabled={actionLoading}
                              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✓ Approve Verification
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVerification(verification);
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading}
                              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {activeTab === 'rejected' && (
                          <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
                            Awaiting user resubmission
                          </div>
                        )}
                        {activeTab === 'approved' && (
                          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                            <span>✅</span> Verified User
                          </div>
                        )}
                        <button
                          onClick={() => window.open(`/${params.lang}/ads?userId=${verification.userId}`, '_blank')}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          📋 View User Ads
                        </button>
                        {verification.shopSlug && (
                          <button
                            onClick={() => window.open(`/${params.lang}/shop/${verification.shopSlug}`, '_blank')}
                            className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            🏪 View Shop
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Reject Individual Verification
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to reject: <strong>{selectedVerification.fullName}</strong>
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
                  setSelectedVerification(null);
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
