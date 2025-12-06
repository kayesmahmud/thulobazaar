'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getVerifications } from '@/lib/editorApi';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface Verification {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  type: 'business' | 'individual';
  // Business fields
  businessName?: string;
  businessLicense?: string;
  businessCategory?: string;
  // Individual fields
  idDocumentType?: string;
  idDocumentNumber?: string;
  // Payment and duration fields
  durationDays?: number;
  paymentAmount?: number;
  paymentStatus?: string;
}

export default function AllVerificationsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'business' | 'individual'>('all');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch ALL verifications (pending, approved, rejected)
      const response = await getVerifications('all', 'all');

      if (response.success && response.data) {
        // API returns camelCase, map to our interface
        const allVerifications = response.data.map((v: any) => ({
          id: v.id,
          userId: v.userId,
          email: v.email,
          fullName: v.fullName,
          businessName: v.businessName,
          businessLicense: v.businessLicenseDocument,
          businessCategory: v.businessCategory,
          idDocumentType: v.idDocumentType,
          idDocumentNumber: v.idDocumentNumber,
          status: v.status,
          submittedAt: v.createdAt,
          reviewedAt: v.reviewedAt,
          rejectionReason: v.rejectionReason,
          type: v.type,
          // Payment and duration fields
          durationDays: v.durationDays,
          paymentAmount: v.paymentAmount,
          paymentStatus: v.paymentStatus,
        }));

        setVerifications(allVerifications);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
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

  const filteredVerifications = verifications.filter((v) => {
    // Status filter
    if (activeTab !== 'all' && v.status !== activeTab) return false;

    // Type filter
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        v.email?.toLowerCase().includes(search) ||
        v.fullName?.toLowerCase().includes(search) ||
        v.businessName?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const stats = {
    all: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
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
            <h1 className="text-3xl font-bold text-gray-900">All Verifications</h1>
            <p className="text-gray-600 mt-1">
              View and filter all verification requests
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          {/* Status Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({stats[tab]})
              </button>
            ))}
          </div>

          {/* Type and Search Filters */}
          <div className="flex gap-4 flex-wrap items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'business' | 'individual')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="business">Business Only</option>
              <option value="individual">Individual Only</option>
            </select>

            <input
              type="text"
              placeholder="Search by email, name, or business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Verifications List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl font-semibold text-gray-700 mb-2">No verifications found</div>
              <div className="text-gray-500">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No verification requests yet'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      User / Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVerifications.map((verification) => (
                    <tr key={`${verification.type}-${verification.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.type === 'business'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {verification.type === 'business' ? '🏢 Business' : '👤 Individual'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {verification.type === 'business' ? verification.businessName : verification.fullName}
                        </div>
                        <div className="text-xs text-gray-500">{verification.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {verification.durationDays ? (
                          <span className="text-sm font-medium text-blue-700">
                            {verification.durationDays === 30 ? '1 Mo' :
                             verification.durationDays === 90 ? '3 Mo' :
                             verification.durationDays === 180 ? '6 Mo' :
                             verification.durationDays === 365 ? '1 Yr' :
                             `${verification.durationDays}d`}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {verification.paymentStatus === 'free' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            FREE
                          </span>
                        ) : verification.paymentAmount !== undefined && verification.paymentAmount > 0 ? (
                          <span className="text-sm font-medium text-green-700">
                            NPR {verification.paymentAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          verification.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : verification.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {verification.status === 'approved' && '✓ '}
                          {verification.status === 'rejected' && '✗ '}
                          {verification.status === 'pending' && '⏳ '}
                          {verification.status.toUpperCase()}
                        </span>
                        {verification.status === 'rejected' && verification.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1">
                            {verification.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            if (verification.type === 'business') {
                              router.push(`/${params.lang}/editor/business-verification`);
                            } else {
                              router.push(`/${params.lang}/editor/individual-verification`);
                            }
                          }}
                          className="text-emerald-600 hover:text-emerald-900 font-medium"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-gray-400">
            <div className="text-sm font-medium text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900">{stats.all}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 shadow-sm border-l-4 border-yellow-400">
            <div className="text-sm font-medium text-yellow-800 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 shadow-sm border-l-4 border-green-400">
            <div className="text-sm font-medium text-green-800 mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-6 shadow-sm border-l-4 border-red-400">
            <div className="text-sm font-medium text-red-800 mb-1">Rejected</div>
            <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
