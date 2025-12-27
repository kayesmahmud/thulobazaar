'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { StatsCards, PricingTable, AddPricingModal } from './components';
import { usePromotionPricing } from './usePromotionPricing';
import { PRICING_TIERS, pricingTierLabels, pricingTierColors } from './types';

export default function PromotionPricingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const {
    pricings,
    filteredPricings,
    loading,
    selectedTier,
    setSelectedTier,
    groupedPricings,
    tierCounts,
    loadPricings,
    updatePricing,
    toggleActive,
    createPricing,
  } = usePromotionPricing();

  const [showAddModal, setShowAddModal] = useState(false);

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

    loadPricings();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadPricings]);

  const handleAdd = async (form: Parameters<typeof createPricing>[0]) => {
    // Add selected tier to form
    const formWithTier = { ...form, pricing_tier: selectedTier };
    const success = await createPricing(formWithTier);
    if (success) {
      setShowAddModal(false);
    }
    return success;
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
            <p className="mt-4 text-gray-600">Loading promotion pricing...</p>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Promotion Pricing Management</h1>
            <p className="text-gray-600 mt-1">Manage pricing for ad promotions by category tier</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            + Add New Pricing
          </button>
        </div>

        {/* Tier Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Pricing Tiers">
              {PRICING_TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`
                    whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors
                    ${selectedTier === tier
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${pricingTierColors[tier]}`}>
                    {tierCounts[tier] || 0}
                  </span>
                  {pricingTierLabels[tier]}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Current Tier Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${pricingTierColors[selectedTier]}`}>
              {pricingTierLabels[selectedTier]}
            </span>
            <span className="text-gray-600">
              {selectedTier === 'default'
                ? 'Base pricing for all categories not assigned to a specific tier'
                : selectedTier === 'electronics'
                ? 'Higher pricing for Mobiles & Electronics categories'
                : selectedTier === 'vehicles'
                ? 'Premium pricing for Vehicles category'
                : 'Premium pricing for Property/Real Estate category'
              }
            </span>
          </div>
        </div>

        {/* Stats */}
        <StatsCards pricings={filteredPricings} groupedPricings={groupedPricings} />

        {/* Pricing Tables by Type */}
        <div className="space-y-6">
          {Object.keys(groupedPricings).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pricing configured for this tier yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Add First Pricing
              </button>
            </div>
          ) : (
            Object.entries(groupedPricings).map(([promotionType, typePricings]) => (
              <PricingTable
                key={promotionType}
                promotionType={promotionType}
                pricings={typePricings}
                onUpdate={updatePricing}
                onToggleActive={toggleActive}
              />
            ))
          )}
        </div>

        {/* Add Modal */}
        <AddPricingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          selectedTier={selectedTier}
        />
      </div>
    </DashboardLayout>
  );
}
