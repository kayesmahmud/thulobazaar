'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getVerifications,
  approveBusinessVerification,
  rejectBusinessVerification,
} from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface BusinessVerification {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  businessName: string;
  businessLicense?: string;
  businessCategory?: string;
  businessDescription?: string;
  businessWebsite?: string;
  businessPhone?: string;
  businessAddress?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentStatus?: string;
  durationDays?: number;
  status: string;
  submittedAt: string;
  type: string;
  // Shop slug for viewing user's shop
  shopSlug?: string;
  // Rejection reason
  rejectionReason?: string;
}

export default function BusinessVerificationPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [verifications, setVerifications] = useState<BusinessVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<BusinessVerification | null>(null);
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
      // Use getVerifications with the active tab status and filter by business type
      const response = await getVerifications(activeTab, 'business');

      if (response.success && Array.isArray(response.data)) {
        // API already returns camelCase, so use camelCase field names
        const businessVerifications = response.data
          .map((v: any) => ({
            id: v.id,
            userId: v.userId,
            email: v.email || '',
            fullName: v.fullName || '',
            businessName: v.businessName || '',
            businessLicense: v.businessLicenseDocument,
            businessCategory: v.businessCategory,
            businessDescription: v.businessDescription,
            businessWebsite: v.businessWebsite,
            businessPhone: v.businessPhone,
            businessAddress: v.businessAddress,
            paymentReference: v.paymentReference,
            paymentAmount: v.paymentAmount,
            paymentStatus: v.paymentStatus,
            durationDays: v.durationDays,
            status: v.status,
            submittedAt: v.createdAt,
            type: v.type,
            // Shop slug for viewing user's shop
            shopSlug: v.shopSlug,
            // Rejection reason
            rejectionReason: v.rejectionReason,
          }));
        setVerifications(businessVerifications);
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
    if (!confirm('Are you sure you want to approve this business verification?')) return;

    try {
      setActionLoading(true);
      const response = await approveBusinessVerification(verificationId);

      if (response.success) {
        alert('Business verification approved successfully!');
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
      const response = await rejectBusinessVerification(
        selectedVerification.id,  // Use verification request ID, not userId
        rejectReason
      );

      if (response.success) {
        alert('Business verification rejected successfully!');
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
      ? v.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">Business Verification</h1>
            <p className="text-gray-600 mt-1">
              Review and approve business verification requests
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
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
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
            activeTab === 'pending' ? 'from-blue-50 to-blue-100 border-blue-200' :
            activeTab === 'rejected' ? 'from-red-50 to-red-100 border-red-200' :
            'from-green-50 to-green-100 border-green-200'
          } border-2 rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium mb-1 ${
                  activeTab === 'pending' ? 'text-blue-700' :
                  activeTab === 'rejected' ? 'text-red-700' :
                  'text-green-700'
                }`}>
                  {activeTab === 'pending' ? 'Total Pending' :
                   activeTab === 'rejected' ? 'Total Rejected' :
                   'Total Verified'}
                </div>
                <div className={`text-3xl font-bold ${
                  activeTab === 'pending' ? 'text-blue-900' :
                  activeTab === 'rejected' ? 'text-red-900' :
                  'text-green-900'
                }`}>
                  {filteredVerifications.length}
                </div>
              </div>
              <div className="text-4xl">
                {activeTab === 'pending' ? '🏢' :
                 activeTab === 'rejected' ? '❌' :
                 '✅'}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-1">With Documents</div>
                <div className="text-3xl font-bold text-purple-900">
                  {filteredVerifications.filter((v) => v.businessLicense).length}
                </div>
              </div>
              <div className="text-4xl">📄</div>
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
            placeholder="Search by business name, owner name, or email..."
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
                {activeTab === 'pending' ? '🏢' :
                 activeTab === 'rejected' ? '📋' :
                 '✅'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending' ? 'No pending verifications' :
                 activeTab === 'rejected' ? 'No rejected verifications' :
                 'No verified businesses yet'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending' ? 'All business verification requests have been processed' :
                 activeTab === 'rejected' ? 'No business verification applications have been rejected' :
                 'No businesses have been verified yet'}
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
                    {/* Business Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                        <span className="text-5xl">🏢</span>
                      </div>
                    </div>

                    {/* Verification Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {verification.businessName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <span>👤</span> {verification.fullName}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📧</span> {verification.email}
                            </span>
                          </div>
                          {verification.businessPhone && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <span>📞</span> {verification.businessPhone}
                              </span>
                            </div>
                          )}
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

                      {/* Business Info Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        {verification.businessCategory && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Category
                            </div>
                            <div className="text-sm text-gray-900">
                              {verification.businessCategory}
                            </div>
                          </div>
                        )}
                        {verification.businessAddress && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Address</div>
                            <div className="text-sm text-gray-900">
                              {verification.businessAddress}
                            </div>
                          </div>
                        )}
                        {verification.businessWebsite && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-1">Website</div>
                            <div className="text-sm text-blue-600 hover:underline">
                              <a
                                href={verification.businessWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {verification.businessWebsite}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Business License Document */}
                      {verification.businessLicense && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <span>📄</span> Business License Document
                          </h4>
                          <div className="flex gap-4 items-start">
                            {/* Document Thumbnail */}
                            <a
                              href={`/uploads/business_verification/${verification.businessLicense}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group"
                            >
                              <div className="relative w-32 h-32 bg-white border-2 border-blue-200 rounded-lg overflow-hidden hover:border-blue-400 transition-colors">
                                {verification.businessLicense.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img
                                    src={`/uploads/business_verification/${verification.businessLicense}`}
                                    alt="Business License"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-100 to-pink-100">
                                    <svg className="w-12 h-12 text-red-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-bold text-red-700">PDF</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-2 py-1 rounded">
                                    Click to view
                                  </span>
                                </div>
                              </div>
                            </a>

                            {/* Document Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 mb-2 break-all">
                                {verification.businessLicense}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`/uploads/business_verification/${verification.businessLicense}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open in New Tab
                                </a>
                                <a
                                  href={`/uploads/business_verification/${verification.businessLicense}`}
                                  download={verification.businessLicense}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </a>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                💡 Click thumbnail to view full size
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment & Duration Information */}
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
                              ) : verification.paymentAmount ? (
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
                                {verification.paymentReference.length > 20
                                  ? `${verification.paymentReference.substring(0, 20)}...`
                                  : verification.paymentReference}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {verification.businessDescription && (
                        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="text-xs font-medium text-purple-700 mb-1">
                            Business Description
                          </div>
                          <div className="text-sm text-gray-900">
                            {verification.businessDescription}
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
                        activeTab === 'pending' ? 'bg-blue-50 border border-blue-200 text-blue-900' :
                        activeTab === 'rejected' ? 'bg-red-50 border border-red-200 text-red-900' :
                        'bg-green-50 border border-green-200 text-green-900'
                      }`}>
                        <span className="font-medium">Note:</span>{' '}
                        {activeTab === 'pending' ? 'Business verification allows businesses to display a verified badge and build trust with customers.' :
                         activeTab === 'rejected' ? 'This business can resubmit their verification with corrected documents. They will appear in the Pending tab once resubmitted.' :
                         'This business has been verified and can display the verified badge on their profile and listings.'}
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
                            <span>✅</span> Verified Business
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
              Reject Business Verification
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to reject: <strong>{selectedVerification.businessName}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection (this will be shown to the user)..."
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
