'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/navigation';

type TabType = 'pending' | 'verified-business' | 'verified-individual' | 'suspended-rejected';

interface Verification {
  id: number;
  type: 'business' | 'individual';
  user_id: number;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  // Business specific
  business_name?: string;
  business_category?: string;
  business_license_document?: string;
  // Individual specific
  id_document_type?: string;
  id_document_front?: string;
  shop_slug?: string;
}

interface SuspendedUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  businessVerificationStatus: string | null;
  createdAt: string;
  shopSlug: string | null;
  adCount: number;
}

export default function VerificationsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingVerifications, setPendingVerifications] = useState<Verification[]>([]);
  const [verifiedBusiness, setVerifiedBusiness] = useState<Verification[]>([]);
  const [verifiedIndividual, setVerifiedIndividual] = useState<Verification[]>([]);
  const [suspendedRejected, setSuspendedRejected] = useState<SuspendedUser[]>([]);
  const [verificationStats, setVerificationStats] = useState({
    pending: 0,
    verifiedBusiness: 0,
    verifiedIndividual: 0,
    suspendedRejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const fetchVerificationStats = async () => {
    const res = await fetch('/api/super-admin/verification-stats', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
    return res.json();
  };

  const fetchVerifiedList = async (type: 'business' | 'individual') => {
    const query = searchQuery ? `?type=${type}&search=${encodeURIComponent(searchQuery)}` : `?type=${type}`;
    const res = await fetch(`/api/super-admin/verification-list${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`List fetch failed: ${res.status}`);
    return res.json();
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading verification data...');

      // Load all data in parallel with individual error handling
      const results = await Promise.allSettled([
        fetchVerificationStats(),
        apiClient.getVerificationsByStatus('pending', 'all'),
        fetchVerifiedList('business'),
        fetchVerifiedList('individual'),
        apiClient.getSuspendedRejectedUsers({ limit: 100 }),
      ]);

      // Handle verification stats
      if (results[0].status === 'fulfilled') {
        const statsRes = results[0].value as any;
        if (statsRes?.success && statsRes.data) {
          setVerificationStats(statsRes.data);
        }
      } else {
        console.error('❌ Verification stats error:', results[0].reason);
      }

      // Handle pending verifications
      if (results[1].status === 'fulfilled') {
        const pendingRes = results[1].value;
        console.log('✅ Pending:', pendingRes);
        if (pendingRes.success && pendingRes.data) {
          setPendingVerifications(pendingRes.data.map((item: any) => ({
            ...item,
            type: item.business_name ? 'business' : 'individual',
          })));
        }
      } else {
        console.error('❌ Pending error:', results[1].reason);
      }

      // Handle business verifications
      if (results[2].status === 'fulfilled') {
        const businessRes = results[2].value as any;
        console.log('✅ Business:', businessRes);
        if (businessRes?.success && businessRes.data) {
          setVerifiedBusiness(
            businessRes.data.map((item: any) => ({
              ...item,
              type: 'business',
            }))
          );
        }
      } else {
        console.error('❌ Business error:', results[2].reason);
      }

      // Handle individual verifications
      if (results[3].status === 'fulfilled') {
        const individualRes = results[3].value as any;
        console.log('✅ Individual:', individualRes);
        if (individualRes?.success && individualRes.data) {
          setVerifiedIndividual(
            individualRes.data.map((item: any) => ({
              ...item,
              type: 'individual',
            }))
          );
        }
      } else {
        console.error('❌ Individual error:', results[3].reason);
      }

      // Handle suspended/rejected users
      if (results[4].status === 'fulfilled') {
        const suspendedRes = results[4].value;
        console.log('✅ Suspended:', suspendedRes);
        if (suspendedRes.success && suspendedRes.data) {
          setSuspendedRejected(suspendedRes.data);
        }
      } else {
        console.error('❌ Suspended error:', results[4].reason);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading verifications:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadData();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadData]);

  const navSections = getSuperAdminNavSections(params.lang);

  // Filter functions
  const filterBySearch = (items: Verification[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((v) =>
      v.business_name?.toLowerCase().includes(query) ||
      v.full_name?.toLowerCase().includes(query) ||
      v.email?.toLowerCase().includes(query)
    );
  };

  const filterSuspendedBySearch = (items: SuspendedUser[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((u) =>
      u.fullName?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  };

  const tabCounts = {
    pending: verificationStats.pending || pendingVerifications.length,
    verifiedBusiness: verificationStats.verifiedBusiness || verifiedBusiness.length,
    verifiedIndividual: verificationStats.verifiedIndividual || verifiedIndividual.length,
    suspendedRejected: verificationStats.suspendedRejected || suspendedRejected.length,
  };

  const tabs = [
    { id: 'pending' as TabType, label: 'Pending', count: tabCounts.pending, icon: '⏳', color: 'amber' },
    { id: 'verified-business' as TabType, label: 'Verified Business', count: tabCounts.verifiedBusiness, icon: '👔', color: 'blue' },
    { id: 'verified-individual' as TabType, label: 'Verified Individual', count: tabCounts.verifiedIndividual, icon: '👤', color: 'emerald' },
    { id: 'suspended-rejected' as TabType, label: 'Suspended/Rejected', count: tabCounts.suspendedRejected, icon: '🚫', color: 'rose' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Verification Overview
        </h1>
        <p className="text-gray-600 text-lg">
          View all verification requests and account statuses (read-only)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeTab === tab.id
                ? `border-${tab.color}-500 bg-${tab.color}-50 shadow-lg`
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{tab.icon}</span>
              <span className={`text-2xl font-bold ${activeTab === tab.id ? `text-${tab.color}-600` : 'text-gray-900'}`}>
                {tab.count}
              </span>
            </div>
            <div className={`text-sm font-medium ${activeTab === tab.id ? `text-${tab.color}-700` : 'text-gray-600'}`}>
              {tab.label}
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
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
      </div>

      {/* Content based on active tab */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {activeTab === 'pending' && (
          <VerificationTable
            verifications={filterBySearch(pendingVerifications)}
            title="Pending Verification Requests"
            emptyMessage="No pending verifications"
            formatDate={formatDate}
            showStatus
          />
        )}

        {activeTab === 'verified-business' && (
          <VerificationTable
            verifications={filterBySearch(verifiedBusiness)}
            title="Verified Business Accounts"
            emptyMessage="No verified business accounts"
            formatDate={formatDate}
          />
        )}

        {activeTab === 'verified-individual' && (
          <VerificationTable
            verifications={filterBySearch(verifiedIndividual)}
            title="Verified Individual Accounts"
            emptyMessage="No verified individual accounts"
            formatDate={formatDate}
          />
        )}

        {activeTab === 'suspended-rejected' && (
          <SuspendedTable
            users={filterSuspendedBySearch(suspendedRejected)}
            formatDate={formatDate}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Verification Table Component
function VerificationTable({
  verifications,
  title,
  emptyMessage,
  formatDate,
  showStatus = false,
}: {
  verifications: Verification[];
  title: string;
  emptyMessage: string;
  formatDate: (date: string) => string;
  showStatus?: boolean;
}) {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Details</th>
              {showStatus && <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>}
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {verifications.length === 0 ? (
              <tr>
                <td colSpan={showStatus ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              verifications.map((v) => (
                <tr key={`${v.type}-${v.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      v.type === 'business'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {v.type === 'business' ? '👔 Business' : '👤 Individual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{v.full_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{v.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {v.type === 'business' ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.business_name}</div>
                        <div className="text-sm text-gray-500">{v.business_category || 'No category'}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.id_document_type || 'ID Document'}</div>
                        {v.shop_slug && (
                          <div className="text-sm text-gray-500">Shop: {v.shop_slug}</div>
                        )}
                      </div>
                    )}
                  </td>
                  {showStatus && (
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {v.status}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(v.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Suspended/Rejected Users Table Component
function SuspendedTable({
  users,
  formatDate,
}: {
  users: SuspendedUser[];
  formatDate: (date: string) => string;
}) {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-red-50">
        <h2 className="text-lg font-bold text-gray-900">Suspended & Rejected Accounts</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Ads</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  No suspended or rejected accounts
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {!u.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        🚫 Suspended
                      </span>
                    ) : u.businessVerificationStatus === 'rejected' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                        ❌ Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                        Unknown
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{u.fullName || 'N/A'}</div>
                    {u.shopSlug && (
                      <div className="text-xs text-gray-500">Shop: {u.shopSlug}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{u.email}</div>
                    {u.phone && <div className="text-sm text-gray-500">{u.phone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{u.adCount}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
