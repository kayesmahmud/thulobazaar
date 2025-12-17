'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { CampaignList, CampaignForm, StatsCards } from './components';
import { usePromotionalCampaigns, Campaign, CampaignFormData } from './usePromotionalCampaigns';

export default function PromotionalCampaignsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const {
    filteredCampaigns,
    loading,
    error,
    filter,
    setFilter,
    stats,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    toggleCampaignActive,
    deleteCampaign,
    setError,
  } = usePromotionalCampaigns();

  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const navSections = useMemo(() => getSuperAdminNavSections(params.lang), [params.lang]);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadCampaigns();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadCampaigns]);

  const handleCreateOrUpdate = async (formData: CampaignFormData) => {
    if (editingCampaign) {
      return updateCampaign(editingCampaign.id, formData);
    }
    return createCampaign(formData);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName || 'Super Admin'}
        userEmail={staff?.email || 'admin@thulobazaar.com'}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading promotional campaigns...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Super Admin'}
      userEmail={staff?.email || 'admin@thulobazaar.com'}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Promotional Campaigns</h1>
            <p className="text-gray-600 mt-1">Create and manage time-limited promotional discounts</p>
          </div>
          <button
            onClick={() => {
              setEditingCampaign(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Campaign
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Filters">
              {[
                { key: 'all', label: 'All Campaigns' },
                { key: 'active', label: 'Active Now' },
                { key: 'inactive', label: 'Inactive/Expired' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'active' | 'inactive')}
                  className={`
                    whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                    ${filter === tab.key
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Campaign List */}
        <CampaignList
          campaigns={filteredCampaigns}
          onEdit={handleEdit}
          onToggleActive={toggleCampaignActive}
          onDelete={deleteCampaign}
        />

        {/* Create/Edit Form Modal */}
        <CampaignForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleCreateOrUpdate}
          editingCampaign={editingCampaign}
        />
      </div>
    </DashboardLayout>
  );
}
