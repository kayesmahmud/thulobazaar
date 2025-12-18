'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin';
import { useVerificationPricing } from './useVerificationPricing';
import { StatsCards, PricingTable, InfoCard } from './components';

export default function VerificationPricingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);

  const {
    staff,
    authLoading,
    navSections,
    handleLogout,
    pricings,
    loading,
    editingId,
    editForm,
    saving,
    groupedPricings,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    setEditForm,
  } = useVerificationPricing(params.lang);

  const layoutProps = {
    lang: params.lang,
    userName: staff?.fullName || 'Super Admin',
    userEmail: staff?.email || 'admin@thulobazaar.com',
    navSections,
    theme: 'superadmin' as const,
    onLogout: handleLogout,
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout {...layoutProps}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading verification pricing...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout {...layoutProps}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Verification Pricing Management</h1>
          <p className="text-gray-600 mt-1">Manage pricing for user verification (Individual & Business)</p>
        </div>

        {/* Stats */}
        <StatsCards
          total={pricings.length}
          individual={pricings.filter((p) => p.verificationType === 'individual').length}
          business={pricings.filter((p) => p.verificationType === 'business').length}
          active={pricings.filter((p) => p.isActive).length}
        />

        {/* Pricing Tables by Type */}
        <div className="space-y-8">
          {Object.entries(groupedPricings).map(([verificationType, typePricings]) => (
            <PricingTable
              key={verificationType}
              verificationType={verificationType}
              pricings={typePricings}
              editingId={editingId}
              editForm={editForm}
              saving={saving}
              onEdit={handleEdit}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onEditFormChange={setEditForm}
            />
          ))}
        </div>

        {/* Info Card */}
        <InfoCard />
      </div>
    </DashboardLayout>
  );
}
