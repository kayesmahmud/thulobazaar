'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout, StatsCard } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface EditorActivity {
  id: number;
  type: 'login' | 'logout' | 'ad_approved' | 'ad_rejected' | 'ad_edited' | 'ad_deleted' | 'business_approved' | 'business_rejected' | 'individual_approved' | 'individual_rejected';
  timestamp: string;
  details?: string;
  relatedId?: number;
}

interface AdWork {
  id: number;
  adTitle: string;
  action: 'approved' | 'rejected' | 'edited' | 'deleted';
  timestamp: string;
  reason?: string;
}

interface VerificationWork {
  id: number;
  sellerName: string;
  action: 'approved' | 'rejected';
  timestamp: string;
  reason?: string;
}

interface EditorDetail {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
  stats: {
    adsApproved: number;
    adsRejected: number;
    adsEdited: number;
    adsDeleted: number;
    businessApproved: number;
    businessRejected: number;
    individualApproved: number;
    individualRejected: number;
    supportTickets: number;
  };
  activities: EditorActivity[];
  adWork: AdWork[];
  businessVerifications: VerificationWork[];
  individualVerifications: VerificationWork[];
  timeBuckets?: {
    daily: { ads: number; business: number; individual: number; supportTickets: number };
    weekly: { ads: number; business: number; individual: number; supportTickets: number };
    monthly: { ads: number; business: number; individual: number; supportTickets: number };
  };
  monthLabel?: string;
}

export default function EditorDetailPage({ params: paramsPromise }: { params: Promise<{ lang: string; id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  // Extract params
  const lang = params.lang;
  const editorId = parseInt(params.id);

  const [editor, setEditor] = useState<EditorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'ads' | 'business' | 'individual'>('activity');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);
  const [pendingYear, setPendingYear] = useState<number | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  }, [logout, router, lang]);

  const loadEditorData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all editors to find this specific one
      const editorsResponse = await apiClient.getEditors();
      if (!editorsResponse.success || !editorsResponse.data) {
        throw new Error('Failed to fetch editors');
      }

      const editorInfo = editorsResponse.data.find((e) => e.id === editorId);
      if (!editorInfo) {
        setEditor(null);
        setLoading(false);
        return;
      }

      const monthQuery = selectedMonth ? `?month=${selectedMonth.month}&year=${selectedMonth.year}` : '';

      // Fetch aggregated activity for this editor (ads + verifications + logs)
      const activityResponse = await fetch(`/api/super-admin/editors/${editorId}/activity${monthQuery}`, {
        credentials: 'include',
      });

      let activities: EditorActivity[] = [];
      let adWork: AdWork[] = [];
      let businessVerifications: VerificationWork[] = [];
      let individualVerifications: VerificationWork[] = [];
      let stats = {
        adsApproved: 0,
        adsRejected: 0,
        adsEdited: 0,
        adsDeleted: 0,
        businessApproved: 0,
        businessRejected: 0,
        individualApproved: 0,
        individualRejected: 0,
        supportTickets: 0,
      };
      let timeBuckets: EditorDetail['timeBuckets'] | undefined = undefined;
      let monthLabel: string | undefined = undefined;

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success && activityData.data) {
          const formatDetails = (val: any) => {
            if (!val) return undefined;
            if (typeof val === 'string') return val;
            if (typeof val === 'object') {
              const entries = Object.entries(val).map(([k, v]) => `${k}: ${v}`);
              return entries.join(' | ');
            }
            return String(val);
          };

          activities = (activityData.data.activities || []).map((a: any) => ({
            id: a.id,
            type: a.type as EditorActivity['type'],
            timestamp: a.timestamp,
            details: formatDetails(a.details),
            relatedId: a.relatedId,
          }));
          adWork = activityData.data.adWork || [];
          businessVerifications = activityData.data.businessVerifications || [];
          individualVerifications = activityData.data.individualVerifications || [];
          stats = activityData.data.stats || stats;
          timeBuckets = activityData.data.timeBuckets || undefined;
          if (selectedMonth) {
            const date = new Date(Date.UTC(selectedMonth.year, selectedMonth.month - 1, 1));
            monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        }
      }

      const editorDetail: EditorDetail = {
        id: editorInfo.id,
        fullName: editorInfo.full_name,
        email: editorInfo.email,
        avatar: editorInfo.avatar,
        status: editorInfo.is_active ? 'active' : 'suspended',
        createdAt: editorInfo.created_at,
        lastLogin: (editorInfo as any).last_login || null,
        stats,
        activities,
        adWork,
        businessVerifications,
        individualVerifications,
        timeBuckets,
        monthLabel,
      };

      setEditor(editorDetail);
      setLoading(false);
    } catch (error) {
      console.error('Error loading editor data:', error);
      setEditor(null);
      setLoading(false);
    }
  }, [editorId, selectedMonth]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }

    loadEditorData();
  }, [authLoading, staff, isSuperAdmin, lang, router, loadEditorData]);

  const navSections = getSuperAdminNavSections(lang, {
    pendingAds: 23,
    editors: 5,
    verifications: 15,
  });

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(Date.UTC(2000, i, 1)).toLocaleDateString('en-US', { month: 'long' }),
    }));
  }, []);

  const yearOptions = useMemo(() => {
    const years: { year: number; label: string }[] = [];
    for (let y = 2025; y <= 2030; y++) {
      years.push({ year: y, label: y.toString() });
    }
    return years;
  }, []);

  const handleSuspend = () => {
    // TODO: Implement actual suspend functionality
    console.log('Suspending editor:', editor?.id);
    setShowSuspendModal(false);
  };

  const handleDelete = () => {
    // TODO: Implement actual delete functionality
    console.log('Deleting editor:', editor?.id);
    setShowDeleteModal(false);
    router.push(`/${lang}/super-admin/editors`);
  };

  const getActivityIcon = (type: EditorActivity['type']) => {
    const icons = {
      login: '🔓',
      logout: '🔒',
      ad_approved: '✅',
      ad_rejected: '❌',
      ad_edited: '✏️',
      ad_deleted: '🗑️',
      business_approved: '✓',
      business_rejected: '✗',
      individual_approved: '✓',
      individual_rejected: '✗',
    };
    return icons[type];
  };

  const getActivityColor = (type: EditorActivity['type']) => {
    if (type.includes('approved')) return 'text-emerald-600 bg-emerald-50';
    if (type.includes('rejected') || type.includes('deleted')) return 'text-rose-600 bg-rose-50';
    if (type.includes('edited')) return 'text-amber-600 bg-amber-50';
    if (type === 'login') return 'text-blue-600 bg-blue-50';
    if (type === 'logout') return 'text-gray-600 bg-gray-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getActivityLabel = (activity: EditorActivity) => {
    const labels: Record<EditorActivity['type'], string> = {
      login: 'Logged In',
      logout: 'Logged Out',
      ad_approved: 'Ad Approved',
      ad_rejected: 'Ad Rejected',
      ad_edited: 'Ad Edited',
      ad_deleted: 'Ad Deleted',
      business_approved: 'Business Approved',
      business_rejected: 'Business Rejected',
      individual_approved: 'Individual Approved',
      individual_rejected: 'Individual Rejected',
    };
    return labels[activity.type];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            <div className="text-lg font-semibold text-gray-700">Loading editor details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!editor) {
    return (
      <DashboardLayout
        lang={lang}
        userName={staff?.fullName || 'Admin User'}
        userEmail={staff?.email || 'admin@thulobazaar.com'}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Editor Not Found</h2>
          <p className="text-gray-600 mb-6">The editor you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push(`/${lang}/super-admin/editors`)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Back to Editors
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={lang}
      userName={staff?.fullName || 'Admin User'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/${lang}/super-admin/editors`)}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Editors
        </button>
      </div>

      {/* Editor Profile Header */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Filter</h2>
            <p className="text-sm text-gray-600">
              View activities for a specific month or all time.
              {editor?.monthLabel ? ` Showing: ${editor.monthLabel}` : ' Showing: All time.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={pendingMonth ?? ''}
              onChange={(e) => setPendingMonth(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            >
              <option value="">Month</option>
              {monthOptions.map((opt) => (
                <option key={opt.month} value={opt.month}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={pendingYear ?? ''}
              onChange={(e) => setPendingYear(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            >
              <option value="">Year</option>
              {yearOptions.map((opt) => (
                <option key={opt.year} value={opt.year}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (pendingMonth && pendingYear) {
                  setSelectedMonth({ month: pendingMonth, year: pendingYear });
                } else {
                  setSelectedMonth(null);
                }
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-indigo-200 shadow-lg">
              {editor.avatar ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/avatars/${editor.avatar}`}
                  alt={editor.fullName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-4xl text-indigo-600 font-bold">{editor.fullName.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{editor.fullName}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    editor.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {editor.status === 'active' ? '✓ Active' : '⏸ Suspended'}
                </span>
              </div>
              <p className="text-gray-600 text-lg mb-1">{editor.email}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Joined: {formatTimestamp(editor.createdAt)}</span>
                {editor.lastLogin && (
                  <>
                    <span>•</span>
                    <span>Last login: {formatTimestamp(editor.lastLogin)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowSuspendModal(true)}
              className={`px-5 py-2.5 border-2 font-semibold rounded-xl transition-all ${
                editor.status === 'active'
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {editor.status === 'active' ? '⏸ Suspend' : '▶️ Activate'}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-2.5 border-2 border-rose-300 text-rose-700 font-semibold rounded-xl hover:bg-rose-50 transition-all"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Ads Approved"
          value={editor.stats.adsApproved}
          icon="✅"
          color="success"
          theme="superadmin"
        />
        <StatsCard
          title="Ads Rejected"
          value={editor.stats.adsRejected}
          icon="❌"
          color="danger"
          theme="superadmin"
        />
        <StatsCard
          title="Business Verified"
          value={editor.stats.businessApproved}
          icon="🏢"
          color="primary"
          theme="superadmin"
        />
        <StatsCard
          title="Individual Verified"
          value={editor.stats.individualApproved}
          icon="👤"
          color="primary"
          theme="superadmin"
        />
        <StatsCard
          title="Support Tickets"
          value={editor.stats.supportTickets}
          icon="🎫"
          color="warning"
          theme="superadmin"
        />
      </div>

      {/* Time-bucketed summary */}
      {editor.timeBuckets && (
        <div className="mb-8 bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📅</span> Activity Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Ads</th>
                  <th className="px-4 py-3 text-left">Business Verifications</th>
                  <th className="px-4 py-3 text-left">Individual Verifications</th>
                  <th className="px-4 py-3 text-left">Support Tickets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: 'Last 24 hours', key: 'daily' },
                  { label: 'Last 7 days', key: 'weekly' },
                  { label: 'Last 30 days', key: 'monthly' },
                ].map((row) => {
                  const bucket = editor.timeBuckets?.[row.key as keyof typeof editor.timeBuckets];
                  return (
                    <tr key={row.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{row.label}</td>
                      <td className="px-4 py-3 text-gray-700">{bucket?.ads ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{bucket?.business ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{bucket?.individual ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{bucket?.supportTickets ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b-2 border-gray-100 bg-gray-50 px-6">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'activity', label: 'Activity Timeline', icon: '📅' },
              { key: 'ads', label: 'Ads Work', icon: '📢', badge: editor.adWork.length },
              { key: 'business', label: 'Business Verifications', icon: '🏢', badge: editor.businessVerifications.length },
              { key: 'individual', label: 'Individual Verifications', icon: '👤', badge: editor.individualVerifications.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold">
                      {tab.badge}
                    </span>
                  )}
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Activity Timeline Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {editor.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{getActivityLabel(activity)}</h4>
                        {activity.details && <p className="text-gray-600 text-sm">{activity.details}</p>}
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ads Work Tab */}
          {activeTab === 'ads' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Ad ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Ad Title</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Reason/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {editor.adWork.map((ad) => (
                    <tr key={ad.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-600">#{ad.id}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{ad.adTitle}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ad.action === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : ad.action === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : ad.action === 'edited'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ad.action.charAt(0).toUpperCase() + ad.action.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{formatTimestamp(ad.timestamp)}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{ad.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Business Verifications Tab */}
          {activeTab === 'business' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Seller Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Reason/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {editor.businessVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-600">#{verification.id}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{verification.sellerName}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            verification.action === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {verification.action.charAt(0).toUpperCase() + verification.action.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{formatTimestamp(verification.timestamp)}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{verification.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Individual Verifications Tab */}
          {activeTab === 'individual' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Seller Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Reason/Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {editor.individualVerifications.map((verification) => (
                    <tr key={verification.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-gray-600">#{verification.id}</td>
                      <td className="py-4 px-4 font-medium text-gray-900">{verification.sellerName}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            verification.action === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {verification.action.charAt(0).toUpperCase() + verification.action.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{formatTimestamp(verification.timestamp)}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{verification.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Suspend/Activate Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {editor.status === 'active' ? 'Suspend Editor?' : 'Activate Editor?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {editor.status === 'active'
                ? `Are you sure you want to suspend ${editor.fullName}? They will no longer be able to access the editor dashboard.`
                : `Are you sure you want to activate ${editor.fullName}? They will regain access to the editor dashboard.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl text-white ${
                  editor.status === 'active'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg'
                }`}
              >
                {editor.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-rose-600 mb-4">Delete Editor?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete {editor.fullName}? This action cannot be undone and all their activity history will be preserved for audit purposes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
