'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { StatsCards, PricingTable, AddPricingModal } from './components';
import { usePromotionPricing } from './usePromotionPricing';

export default function PromotionPricingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const {
    pricings,
    loading,
    groupedPricings,
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
    const success = await createPricing(form);
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
            <p className="text-gray-600 mt-1">Manage pricing for ad promotions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            + Add New Pricing
          </button>
        </div>

        {/* Stats */}
        <StatsCards pricings={pricings} groupedPricings={groupedPricings} />

        {/* Pricing Tables by Type */}
        <div className="space-y-6">
          {Object.entries(groupedPricings).map(([promotionType, typePricings]) => (
            <PricingTable
              key={promotionType}
              promotionType={promotionType}
              pricings={typePricings}
              onUpdate={updatePricing}
              onToggleActive={toggleActive}
            />
          ))}
        </div>

        {/* Add Modal */}
        <AddPricingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      </div>
    </DashboardLayout>
  );
}
