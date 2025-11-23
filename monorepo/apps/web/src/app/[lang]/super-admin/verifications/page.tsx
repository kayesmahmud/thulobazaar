'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface Verification {
  id: number;
  type: 'business' | 'individual';
  user_id: number;
  user_name: string;
  user_email: string;
  status: string;
  created_at: string;
  // Business specific
  business_name?: string;
  business_category?: string;
  business_license_document?: string;
  // Individual specific
  full_name?: string;
  id_document_type?: string;
  id_document_front?: string;
  id_document_back?: string;
  selfie_with_id?: string;
}

export default function VerificationsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'business' | 'individual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const loadVerifications = useCallback(async () => {
    try {
      console.log('🔍 [Verifications] Loading pending verifications...');
      setLoading(true);

      const response = await apiClient.getPendingVerifications();
      console.log('🔍 [Verifications] Response:', response);

      if (response.success && response.data) {
        // Transform the data to include type field
        const transformedData = response.data.map((item: any) => ({
          ...item,
          type: item.business_name ? 'business' : 'individual',
        })) as Verification[];

        setVerifications(transformedData);
        console.log(`✅ [Verifications] Loaded ${transformedData.length} pending verifications`);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ [Verifications] Error loading verifications:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadVerifications();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadVerifications]);

  const handleApprove = async (verification: Verification) => {
    if (!confirm(`Are you sure you want to approve this ${verification.type} verification?`)) return;

    try {
      console.log(`✅ [Verifications] Approving ${verification.type} verification #${verification.id}...`);
      setActionLoading(verification.id);

      await apiClient.reviewVerification(
        verification.id,
        verification.type,
        'approve'
      );

      console.log(`✅ [Verifications] Verification #${verification.id} approved successfully`);
      loadVerifications(); // Reload the list
    } catch (error: any) {
      console.error(`❌ [Verifications] Error approving verification #${verification.id}:`, error);
      alert(error.response?.data?.message || 'Failed to approve verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (verification: Verification) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      console.log(`❌ [Verifications] Rejecting ${verification.type} verification #${verification.id}...`);
      setActionLoading(verification.id);

      await apiClient.reviewVerification(
        verification.id,
        verification.type,
        'reject',
        reason
      );

      console.log(`❌ [Verifications] Verification #${verification.id} rejected successfully`);
      loadVerifications(); // Reload the list
    } catch (error: any) {
      console.error(`❌ [Verifications] Error rejecting verification #${verification.id}:`, error);
      alert(error.response?.data?.message || 'Failed to reject verification');
    } finally {
      setActionLoading(null);
    }
  };

  const navSections = getSuperAdminNavSections(params.lang);

  // Filter verifications
  const filteredVerifications = verifications.filter((v) => {
    const matchesType = filterType === 'all' || v.type === filterType;
    const matchesSearch =
      (v.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user_email?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && (searchQuery === '' || matchesSearch);
  });

  const businessCount = verifications.filter((v) => v.type === 'business').length;
  const individualCount = verifications.filter((v) => v.type === 'individual').length;

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
            <div className="text-lg font-semibold text-gray-700">Loading verifications...</div>
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
              Verification Management
            </h1>
            <p className="text-gray-600 text-lg">
              Review and approve business and individual seller verification requests
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md border-2 border-indigo-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">✓</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{verifications.length}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Total Pending</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border-2 border-amber-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">👔</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{businessCount}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Business Verifications</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border-2 border-emerald-100 p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">👤</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{individualCount}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">Individual Verifications</div>
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
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'business', 'individual'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  filterType === type
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Applicant</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Details</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Submitted</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-lg">No pending verifications found</div>
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((verification) => (
                  <tr key={`${verification.type}-${verification.id}`} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          verification.type === 'business'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {verification.type === 'business' ? '👔 Business' : '👤 Individual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{verification.user_name}</div>
                        <div className="text-gray-500">{verification.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {verification.type === 'business' ? (
                          <>
                            <div className="font-semibold text-gray-900">{verification.business_name}</div>
                            <div className="text-gray-500">{verification.business_category || 'N/A'}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-semibold text-gray-900">{verification.full_name}</div>
                            <div className="text-gray-500">{verification.id_document_type || 'N/A'}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(verification.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleApprove(verification)}
                          disabled={actionLoading === verification.id}
                          className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === verification.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(verification)}
                          disabled={actionLoading === verification.id}
                          className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === verification.id ? '...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => {
                            // View documents in new window
                            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
                            if (verification.type === 'business' && verification.business_license_document) {
                              window.open(`${baseUrl}/uploads/business-licenses/${verification.business_license_document}`, '_blank');
                            } else if (verification.type === 'individual' && verification.id_document_front) {
                              window.open(`${baseUrl}/uploads/individual_verification/${verification.id_document_front}`, '_blank');
                            }
                          }}
                          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                        >
                          View Docs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
