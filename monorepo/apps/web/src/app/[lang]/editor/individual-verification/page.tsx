'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getPendingVerifications,
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

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPendingVerifications();

      if (response.success && Array.isArray(response.data)) {
        // Filter only individual verifications
        const individualVerifications = response.data.filter(
          (v: any) => v.type === 'individual'
        );
        setVerifications(individualVerifications as any);
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

  const handleApprove = async (userId: number) => {
    if (!confirm('Are you sure you want to approve this individual verification?')) return;

    try {
      setActionLoading(true);
      const response = await approveIndividualVerification(userId);

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
        selectedVerification.userId,
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-1">Total Pending</div>
                <div className="text-3xl font-bold text-purple-900">
                  {filteredVerifications.length}
                </div>
              </div>
              <div className="text-4xl">🪪</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">With Phone</div>
                <div className="text-3xl font-bold text-green-900">
                  {filteredVerifications.filter((v) => v.phone).length}
                </div>
              </div>
              <div className="text-4xl">📞</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-amber-700 mb-1">Avg. Wait Time</div>
                <div className="text-3xl font-bold text-amber-900">1.5d</div>
              </div>
              <div className="text-4xl">⏱️</div>
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
              <div className="text-6xl mb-4">🪪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No pending verifications
              </h3>
              <p className="text-gray-600">
                All individual verification requests have been processed
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

                      {/* Info Note */}
                      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
                        <span className="font-medium">Note:</span> Individual verification allows
                        users to display a verified badge and build trust with buyers.
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(verification.userId)}
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
                        <button
                          onClick={() => window.open(`/${params.lang}/profile/${verification.userId}`, '_blank')}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          👁️ View Profile
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
