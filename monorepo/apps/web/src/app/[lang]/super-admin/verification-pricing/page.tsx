'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface VerificationPricing {
  id: number;
  verificationType: string;
  durationDays: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
}

interface FreeVerificationSettings {
  enabled: boolean;
  durationDays: number;
  types: string[];
}

const durationLabels: Record<number, string> = {
  30: '1 Month',
  90: '3 Months',
  180: '6 Months',
  365: '1 Year',
};

export default function VerificationPricingPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [pricings, setPricings] = useState<VerificationPricing[]>([]);
  const [freeSettings, setFreeSettings] = useState<FreeVerificationSettings>({
    enabled: false,
    durationDays: 180,
    types: ['individual', 'business'],
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ price: number; discountPercentage: number; isActive: boolean }>({
    price: 0,
    discountPercentage: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  }, [logout, router, params.lang]);

  const navSections = useMemo(() => getSuperAdminNavSections(params.lang), [params.lang]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/admin/verification-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPricings(data.data.pricings);
        setFreeSettings(data.data.freeVerification);
      }
    } catch (error) {
      console.error('Error loading verification pricing:', error);
    } finally {
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

  const handleEdit = (pricing: VerificationPricing) => {
    setEditingId(pricing.id);
    setEditForm({
      price: pricing.price,
      discountPercentage: pricing.discountPercentage,
      isActive: pricing.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ price: 0, discountPercentage: 0, isActive: true });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/admin/verification-pricing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          price: editForm.price,
          discountPercentage: editForm.discountPercentage,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        loadData();
      } else {
        alert('Failed to update pricing: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      alert('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFreeVerification = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('editorToken');

      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          settingKey: 'free_verification_enabled',
          value: !freeSettings.enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFreeSettings(prev => ({ ...prev, enabled: !prev.enabled }));
      } else {
        alert('Failed to update setting: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  // Group pricings by verification type
  const groupedPricings = pricings.reduce((acc, pricing) => {
    if (!acc[pricing.verificationType]) {
      acc[pricing.verificationType] = [];
    }
    acc[pricing.verificationType]!.push(pricing);
    return acc;
  }, {} as Record<string, VerificationPricing[]>);

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
            <p className="mt-4 text-gray-600">Loading verification pricing...</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Verification Pricing Management</h1>
          <p className="text-gray-600 mt-1">Manage pricing for user verification (Individual & Business)</p>
        </div>

        {/* Free Verification Promotion Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎁</div>
              <div>
                <h2 className="text-xl font-bold text-green-800">Free Verification Promotion</h2>
                <p className="text-green-700">
                  When enabled, new users get <strong>{durationLabels[freeSettings.durationDays] || `${freeSettings.durationDays} days`}</strong> free verification
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Applies to: {freeSettings.types.map(t => t === 'individual' ? 'Individual' : 'Business').join(' & ')} verification
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                freeSettings.enabled
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {freeSettings.enabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <button
                onClick={handleToggleFreeVerification}
                disabled={saving}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  freeSettings.enabled
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}
              >
                {saving ? 'Saving...' : freeSettings.enabled ? 'Disable Promotion' : 'Enable Promotion'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Pricing Rules</div>
            <div className="text-2xl font-bold text-gray-800">{pricings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Individual Plans</div>
            <div className="text-2xl font-bold text-blue-600">
              {pricings.filter((p) => p.verificationType === 'individual').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Business Plans</div>
            <div className="text-2xl font-bold text-yellow-600">
              {pricings.filter((p) => p.verificationType === 'business').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Rules</div>
            <div className="text-2xl font-bold text-green-600">
              {pricings.filter((p) => p.isActive).length}
            </div>
          </div>
        </div>

        {/* Pricing Tables by Type */}
        <div className="space-y-8">
          {Object.entries(groupedPricings).map(([verificationType, typePricings]) => (
            <div key={verificationType} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {verificationType === 'individual' ? '👤' : '🏢'}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {verificationType === 'individual' ? 'Individual Verification' : 'Business Verification'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {verificationType === 'individual'
                        ? 'Blue badge - Personal identity verification'
                        : 'Gold badge - Business/company verification'}
                    </p>
                  </div>
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
                        Price (NPR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Final Price
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
                    {typePricings
                      .sort((a, b) => a.durationDays - b.durationDays)
                      .map((pricing) => {
                        const finalPrice = pricing.price * (1 - pricing.discountPercentage / 100);
                        return (
                          <tr key={pricing.id} className={!pricing.isActive ? 'opacity-50 bg-gray-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {durationLabels[pricing.durationDays] || `${pricing.durationDays} days`}
                              </div>
                              <div className="text-xs text-gray-500">{pricing.durationDays} days</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingId === pricing.id ? (
                                <input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })
                                  }
                                  className="w-28 px-2 py-1 border border-gray-300 rounded"
                                  step="1"
                                  min="0"
                                />
                              ) : (
                                <span>NPR {pricing.price.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {editingId === pricing.id ? (
                                <input
                                  type="number"
                                  value={editForm.discountPercentage}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      discountPercentage: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                  min="0"
                                  max="100"
                                />
                              ) : (
                                <span className={pricing.discountPercentage > 0 ? 'text-green-600 font-medium' : ''}>
                                  {pricing.discountPercentage}%
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg font-bold text-gray-900">
                                NPR {finalPrice.toLocaleString()}
                              </span>
                              {pricing.discountPercentage > 0 && (
                                <span className="ml-2 text-xs text-green-600">
                                  (Save {pricing.discountPercentage}%)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {editingId === pricing.id ? (
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editForm.isActive}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, isActive: e.target.checked })
                                    }
                                    className="rounded"
                                  />
                                  <span className="text-xs">Active</span>
                                </label>
                              ) : (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    pricing.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {pricing.isActive ? 'Active' : 'Inactive'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {editingId === pricing.id ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(pricing.id)}
                                    disabled={saving}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {saving ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEdit(pricing)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">How Verification Pricing Works</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• Users select a verification type (Individual or Business) and duration (1/3/6/12 months)</li>
            <li>• The final price is calculated as: Base Price - (Base Price × Discount %)</li>
            <li>• When <strong>Free Verification Promotion</strong> is enabled, new users get 6 months free</li>
            <li>• Editors review documents and approve/reject verification requests</li>
            <li>• After the period ends, users need to renew their verification</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
