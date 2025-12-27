'use client';

import { useEffect, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useCategoryPricingTiers } from './useCategoryPricingTiers';
import { PRICING_TIERS, pricingTierLabels, pricingTierColors, pricingTierDescriptions } from './types';
import type { PricingTier, Category } from './types';

export default function CategoryPricingTiersPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const {
    categories,
    loading,
    saving,
    loadMappings,
    updateTier,
    removeTier,
    getTierForCategory,
    categoriesByTier,
    tierCounts,
  } = useCategoryPricingTiers();

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

    loadMappings();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadMappings]);

  const handleTierChange = async (category: Category, newTier: PricingTier) => {
    const currentTier = getTierForCategory(category.name);
    if (newTier === currentTier) return;

    if (newTier === 'default') {
      // Remove the mapping to revert to default
      await removeTier(category.name);
    } else {
      await updateTier(category.name, category.id, newTier);
    }
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
            <p className="mt-4 text-gray-600">Loading category pricing tiers...</p>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Category Pricing Tiers</h1>
          <p className="text-gray-600 mt-1">
            Assign categories to pricing tiers. Higher tiers have higher promotion prices.
          </p>
        </div>

        {/* Tier Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier}
              className={`p-4 rounded-lg border-2 ${
                tier === 'default' ? 'border-gray-200 bg-gray-50' :
                tier === 'electronics' ? 'border-blue-200 bg-blue-50' :
                tier === 'vehicles' ? 'border-green-200 bg-green-50' :
                'border-purple-200 bg-purple-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pricingTierColors[tier]}`}>
                  {pricingTierLabels[tier]}
                </span>
                <span className="text-2xl font-bold text-gray-800">
                  {tierCounts[tier]}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {pricingTierDescriptions[tier]}
              </p>
            </div>
          ))}
        </div>

        {/* Category Assignment Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Category Tier Assignments</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a tier for each category to determine its promotion pricing.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assign Tier
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => {
                  const currentTier = getTierForCategory(category.name);
                  return (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${pricingTierColors[currentTier]}`}>
                          {pricingTierLabels[currentTier]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={currentTier}
                          onChange={(e) => handleTierChange(category, e.target.value as PricingTier)}
                          disabled={saving}
                          className={`
                            px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${saving ? 'animate-pulse' : ''}
                          `}
                        >
                          {PRICING_TIERS.map((tier) => (
                            <option key={tier} value={tier}>
                              {pricingTierLabels[tier]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No categories found.</p>
            </div>
          )}
        </div>

        {/* Tier Breakdown */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PRICING_TIERS.filter(tier => tier !== 'default').map((tier) => (
            <div key={tier} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className={`px-6 py-4 border-b ${
                tier === 'electronics' ? 'bg-blue-50 border-blue-200' :
                tier === 'vehicles' ? 'bg-green-50 border-green-200' :
                'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {pricingTierLabels[tier]}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${pricingTierColors[tier]}`}>
                    {tierCounts[tier]} categories
                  </span>
                </div>
              </div>
              <div className="p-4">
                {categoriesByTier[tier].length > 0 ? (
                  <ul className="space-y-2">
                    {categoriesByTier[tier].map((cat) => (
                      <li key={cat.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <span className="text-gray-700">{cat.name}</span>
                        <button
                          onClick={() => handleTierChange(cat, 'default')}
                          disabled={saving}
                          className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No categories assigned to this tier.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-800 mb-2">How Pricing Tiers Work</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• <strong>Default:</strong> Base pricing for all categories not explicitly assigned</li>
            <li>• <strong>Electronics:</strong> ~1.5x base price for electronics, mobiles, gadgets</li>
            <li>• <strong>Vehicles:</strong> ~2x base price for cars, motorcycles, vehicles</li>
            <li>• <strong>Property:</strong> ~2.5x base price for real estate, land, apartments</li>
            <li className="mt-2">Pricing is automatically applied when users promote ads in these categories.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
