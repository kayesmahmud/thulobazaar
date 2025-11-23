'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getPendingVerifications,
  reviewBusinessVerification,
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
  status: string;
  submittedAt: string;
  type: string;
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

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPendingVerifications();

      if (response.success && Array.isArray(response.data)) {
        // Filter only business verifications
        const businessVerifications = response.data
          .filter((v: any) => v.type === 'business')
          .map((v: any) => ({
            // Transform snake_case to camelCase
            id: v.id,
            userId: v.user_id,
            email: v.email,
            fullName: v.full_name,
            businessName: v.business_name,
            businessLicense: v.business_license_document,
            businessCategory: v.business_category,
            businessDescription: v.business_description,
            businessWebsite: v.business_website,
            businessPhone: v.business_phone,
            businessAddress: v.business_address,
            paymentReference: v.payment_reference,
            paymentAmount: v.payment_amount,
            status: v.status,
            submittedAt: v.created_at,
            type: v.type,
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
  }, []);

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
      const response = await reviewBusinessVerification(verificationId, 'approve');

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
      const response = await reviewBusinessVerification(
        selectedVerification.id,
        'reject',
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Total Pending</div>
                <div className="text-3xl font-bold text-blue-900">
                  {filteredVerifications.length}
                </div>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">With Documents</div>
                <div className="text-3xl font-bold text-green-900">
                  {filteredVerifications.filter((v) => v.businessLicense).length}
                </div>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-700 mb-1">Avg. Wait Time</div>
                <div className="text-3xl font-bold text-amber-900">2.3d</div>
              </div>
              <div className="text-4xl">⏱️</div>
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
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No pending verifications
              </h3>
              <p className="text-gray-600">All business verification requests have been processed</p>
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

                      {/* License Document with Thumbnail */}
                      {verification.businessLicense && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
                          <div className="text-xs font-medium text-purple-700 mb-3 flex items-center gap-2">
                            <span className="text-lg">📄</span>
                            Business License Document
                          </div>
                          <div className="flex gap-4 items-start">
                            {/* Document Thumbnail */}
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/business_verification/${verification.businessLicense}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative block flex-shrink-0"
                            >
                              <div className="w-32 h-32 border-2 border-purple-300 rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                {verification.businessLicense.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  // Image thumbnail
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/business_verification/${verification.businessLicense}`}
                                    alt="Business License"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      if (target.nextElementSibling) {
                                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : (
                                  // PDF or other document icon
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-100 to-pink-100">
                                    <svg className="w-12 h-12 text-red-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-bold text-red-700">PDF</span>
                                  </div>
                                )}
                                {/* Fallback icon (hidden by default) */}
                                <div className="w-full h-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 hidden">
                                  <svg className="w-12 h-12 text-gray-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-bold text-gray-700">FILE</span>
                                </div>
                              </div>
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-purple-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                                <div className="bg-white px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <span className="text-xs font-bold text-purple-700">🔍 View Full Size</span>
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
                                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/business_verification/${verification.businessLicense}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open in New Tab
                                </a>
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/business_verification/${verification.businessLicense}`}
                                  download
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

                      {/* Payment Information */}
                      {(verification.paymentReference || verification.paymentAmount) && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">💳</span>
                            <div className="text-sm font-bold text-green-800">Payment Information</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {verification.paymentReference && (
                              <div>
                                <div className="text-xs font-medium text-green-700 mb-1">
                                  Payment Reference
                                </div>
                                <div className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border border-green-200">
                                  {verification.paymentReference}
                                </div>
                              </div>
                            )}
                            {verification.paymentAmount && (
                              <div>
                                <div className="text-xs font-medium text-green-700 mb-1">
                                  Amount Paid
                                </div>
                                <div className="text-sm font-bold text-green-900">
                                  NPR {verification.paymentAmount.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {verification.businessDescription && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-xs font-medium text-blue-700 mb-1">
                            Business Description
                          </div>
                          <div className="text-sm text-gray-900">
                            {verification.businessDescription}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Business Verification</h3>
            <p className="text-gray-600 mb-4">
              You are about to reject: <strong>{selectedVerification.businessName}</strong>
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
