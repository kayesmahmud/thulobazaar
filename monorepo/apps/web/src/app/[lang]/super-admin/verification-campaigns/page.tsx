'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useVerificationCampaigns, CampaignFormData } from './useVerificationCampaigns';

const DEFAULT_FORM: CampaignFormData = {
  name: '', description: '', discountPercentage: 10, promoCode: '',
  bannerText: '', bannerEmoji: '🎉',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  appliesToTypes: ['individual', 'business'], minDurationDays: null, maxUses: null,
};

export default function VerificationCampaignsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const { staff, loading: authLoading, isSuperAdmin } = useStaffAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CampaignFormData>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const { campaigns, loading, error, stats, loadCampaigns, createCampaign, deleteCampaign, setError } = useVerificationCampaigns();

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
    if (staff && isSuperAdmin) loadCampaigns();
  }, [authLoading, staff, isSuperAdmin, params.lang, router, loadCampaigns]);

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setFormError('Name and dates are required');
      return;
    }
    const result = await createCampaign(form);
    if (result.success) {
      setShowModal(false);
      setForm(DEFAULT_FORM);
      setFormError(null);
    } else {
      setFormError(result.message || 'Failed to create campaign');
    }
  };

  const getCampaignStatus = (c: typeof campaigns[0]) => {
    const now = new Date();
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    if (!c.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    if (end < now) return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    if (start > now) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout navSections={getSuperAdminNavSections(params.lang)} lang={params.lang} staffName={staff?.full_name}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navSections={getSuperAdminNavSections(params.lang)} lang={params.lang} staffName={staff?.full_name}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Verification Campaigns</h1>
            <p className="text-gray-600 mt-1">Create discount campaigns for verification</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            + New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error} <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold">{stats.total}</div><div className="text-sm text-gray-500">Total</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-green-600">{stats.active}</div><div className="text-sm text-gray-500">Active</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div><div className="text-sm text-gray-500">Upcoming</div></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border"><div className="text-2xl font-bold text-gray-400">{stats.expired}</div><div className="text-sm text-gray-500">Expired</div></div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
          <p className="text-sm text-amber-800"><strong>Note:</strong> Only one campaign can be active at a time. Discounts auto-apply to all users.</p>
        </div>

        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-500">No campaigns yet. Create your first campaign!</p>
            </div>
          ) : (
            campaigns.map((c) => {
              const status = getCampaignStatus(c);
              return (
                <div key={c.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{c.bannerEmoji || '🎉'}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg">{c.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                          {c.promoCode && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono">{c.promoCode}</span>}
                        </div>
                        {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                        <div className="text-sm text-gray-500 mt-2">
                          📅 {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {c.appliesToTypes?.map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{c.discountPercentage}%</div>
                        <div className="text-xs text-gray-500">OFF</div>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this campaign?')) deleteCampaign(c.id); }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">New Campaign</h2>
              {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>}
              <div className="space-y-4">
                <input placeholder="Campaign Name *" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Discount %</label>
                    <input type="number" value={form.discountPercentage} onChange={(e) => setForm({...form, discountPercentage: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Promo Code</label>
                    <input value={form.promoCode} onChange={(e) => setForm({...form, promoCode: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Date *</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Date *</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Applies To</label>
                  <div className="flex gap-4">
                    {['individual', 'business'].map((t) => (
                      <label key={t} className="flex items-center gap-2">
                        <input type="checkbox" checked={form.appliesToTypes.includes(t)}
                          onChange={(e) => setForm({...form, appliesToTypes: e.target.checked ? [...form.appliesToTypes, t] : form.appliesToTypes.filter(x => x !== t)})} />
                        <span className="capitalize">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowModal(false); setFormError(null); }} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
