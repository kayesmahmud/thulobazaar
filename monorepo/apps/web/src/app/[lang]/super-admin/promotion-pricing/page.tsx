'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { apiClient } from '@/lib/api';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface PromotionPricing {
  id: number;
  promotion_type: string;
  duration_days: number;
  account_type: string;
  price: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const promotionTypeLabels: Record<string, string> = {
  featured: 'Featured',
  urgent: 'Urgent',
  sticky: 'Sticky',
};

const promotionTypeColors: Record<string, string> = {
  featured: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
  sticky: 'bg-blue-100 text-blue-800',
};

const accountTypeLabels: Record<string, string> = {
  individual: 'Individual',
  individual_verified: 'Individual Verified',
  business: 'Business',
};

export default function PromotionPricingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [pricings, setPricings] = useState<PromotionPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ price: number; discount_percentage: number; is_active: boolean }>({
    price: 0,
    discount_percentage: 0,
    is_active: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    promotion_type: 'featured',
    duration_days: 3,
    account_type: 'individual',
    price: 0,
    discount_percentage: 0,
  });

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  // Navigation sections for sidebar
  const navSections = useMemo(() => getSuperAdminNavSections(params.lang), [params.lang]);

  const loadPricings = useCallback(async () => {
    try {
      console.log('💰 [Promotion Pricing] Loading all pricing...');
      setLoading(true);

      const response = await apiClient.getAllPromotionPricing();
      console.log('💰 [Promotion Pricing] Response:', response);

      if (response.success && response.data) {
        setPricings(response.data);
      }

      setLoading(false);
      console.log('✅ [Promotion Pricing] Loaded successfully');
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error loading:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!staff || !isSuperAdmin) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    loadPricings();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadPricings]);

  const handleEdit = (pricing: PromotionPricing) => {
    setEditingId(pricing.id);
    setEditForm({
      price: pricing.price,
      discount_percentage: pricing.discount_percentage,
      is_active: pricing.is_active,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ price: 0, discount_percentage: 0, is_active: true });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      console.log('💾 [Promotion Pricing] Updating pricing:', { id, ...editForm });
      const response = await apiClient.updatePromotionPricing(id, editForm);

      if (response.success) {
        console.log('✅ [Promotion Pricing] Updated successfully');
        setEditingId(null);
        loadPricings();
      }
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error updating:', error);
      alert('Failed to update pricing');
    }
  };

  const handleToggleActive = async (pricing: PromotionPricing) => {
    try {
      const newStatus = !pricing.is_active;
      console.log(`🔄 [Promotion Pricing] ${newStatus ? 'Activating' : 'Deactivating'} pricing:`, pricing.id);

      const response = await apiClient.updatePromotionPricing(pricing.id, {
        price: pricing.price,
        discount_percentage: pricing.discount_percentage,
        is_active: newStatus,
      });

      if (response.success) {
        console.log('✅ [Promotion Pricing] Status updated');
        loadPricings();
      }
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleAdd = async () => {
    try {
      console.log('➕ [Promotion Pricing] Creating new pricing:', addForm);
      const response = await apiClient.createPromotionPricing(addForm);

      if (response.success) {
        console.log('✅ [Promotion Pricing] Created successfully');
        setShowAddModal(false);
        setAddForm({
          promotion_type: 'featured',
          duration_days: 3,
          account_type: 'individual',
          price: 0,
          discount_percentage: 0,
        });
        loadPricings();
      }
    } catch (error: any) {
      console.error('❌ [Promotion Pricing] Error creating:', error);
      if (error.response?.status === 409) {
        alert('Pricing for this combination already exists');
      } else {
        alert('Failed to create pricing');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this pricing?')) return;

    try {
      console.log('🗑️ [Promotion Pricing] Deactivating pricing:', id);
      const response = await apiClient.deletePromotionPricing(id);

      if (response.success) {
        console.log('✅ [Promotion Pricing] Deactivated successfully');
        loadPricings();
      }
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error deactivating:', error);
      alert('Failed to deactivate pricing');
    }
  };

  // Group pricings by promotion type
  const groupedPricings = pricings.reduce((acc, pricing) => {
    if (!acc[pricing.promotion_type]) {
      acc[pricing.promotion_type] = [];
    }
    acc[pricing.promotion_type]!.push(pricing);
    return acc;
  }, {} as Record<string, PromotionPricing[]>);

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
            ➕ Add New Pricing
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Pricing Rules</div>
            <div className="text-2xl font-bold text-gray-800">{pricings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Rules</div>
            <div className="text-2xl font-bold text-green-600">
              {pricings.filter((p) => p.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Inactive Rules</div>
            <div className="text-2xl font-bold text-gray-400">
              {pricings.filter((p) => !p.is_active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Promotion Types</div>
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(groupedPricings).length}
            </div>
          </div>
        </div>

        {/* Pricing Tables by Type */}
        <div className="space-y-6">
          {Object.entries(groupedPricings).map(([promotionType, typePricings]) => (
            <div key={promotionType} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      promotionTypeColors[promotionType] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {promotionTypeLabels[promotionType] || promotionType}
                  </span>
                  <span className="text-sm text-gray-600">
                    {typePricings.length} pricing rule{typePricings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price (NPR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {typePricings.map((pricing) => (
                      <tr key={pricing.id} className={!pricing.is_active ? 'opacity-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pricing.duration_days} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {accountTypeLabels[pricing.account_type] || pricing.account_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingId === pricing.id ? (
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({ ...editForm, price: parseFloat(e.target.value) })
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                              step="0.01"
                            />
                          ) : (
                            <span className="font-semibold">NPR {pricing.price.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {editingId === pricing.id ? (
                            <input
                              type="number"
                              value={editForm.discount_percentage}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  discount_percentage: parseInt(e.target.value),
                                })
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded"
                              min="0"
                              max="100"
                            />
                          ) : (
                            <span>{pricing.discount_percentage}%</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingId === pricing.id ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editForm.is_active}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, is_active: e.target.checked })
                                }
                                className="rounded"
                              />
                              <span className="text-xs">Active</span>
                            </label>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                pricing.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {pricing.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingId === pricing.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(pricing.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(pricing)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleActive(pricing)}
                                className={`px-3 py-1 rounded text-white ${
                                  pricing.is_active
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-green-500 hover:bg-green-600'
                                }`}
                              >
                                {pricing.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Add New Pricing</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Promotion Type
                  </label>
                  <select
                    value={addForm.promotion_type}
                    onChange={(e) => setAddForm({ ...addForm, promotion_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="featured">Featured</option>
                    <option value="urgent">Urgent</option>
                    <option value="sticky">Sticky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <select
                    value={addForm.duration_days}
                    onChange={(e) =>
                      setAddForm({ ...addForm, duration_days: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={15}>15 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={addForm.account_type}
                    onChange={(e) => setAddForm({ ...addForm, account_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="individual">Individual</option>
                    <option value="individual_verified">Individual Verified</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (NPR)
                  </label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    value={addForm.discount_percentage}
                    onChange={(e) =>
                      setAddForm({ ...addForm, discount_percentage: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Add Pricing
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
