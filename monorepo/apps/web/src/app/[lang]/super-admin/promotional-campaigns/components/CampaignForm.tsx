'use client';

import { useState, useEffect } from 'react';
import { Campaign, CampaignFormData } from '../usePromotionalCampaigns';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => Promise<boolean>;
  editingCampaign?: Campaign | null;
}

const EMOJIS = ['🎉', '🎄', '🎁', '🔥', '⚡', '💰', '🌟', '🎊', '❄️', '🎯', '💎', '🚀'];
const PRICING_TIERS = ['default', 'electronics', 'vehicles', 'property'];
const PROMOTION_TYPES = ['featured', 'urgent', 'sticky'];

export function CampaignForm({ isOpen, onClose, onSubmit, editingCampaign }: CampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    discountPercentage: 10,
    promoCode: '',
    bannerText: '',
    bannerEmoji: '🎉',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    appliesToTiers: [],
    appliesToPromotionTypes: [],
    minDurationDays: null,
    maxUses: null,
  });

  useEffect(() => {
    if (editingCampaign) {
      setFormData({
        name: editingCampaign.name,
        description: editingCampaign.description || '',
        discountPercentage: editingCampaign.discountPercentage,
        promoCode: editingCampaign.promoCode || '',
        bannerText: editingCampaign.bannerText || '',
        bannerEmoji: editingCampaign.bannerEmoji || '🎉',
        startDate: new Date(editingCampaign.startDate).toISOString().split('T')[0],
        endDate: new Date(editingCampaign.endDate).toISOString().split('T')[0],
        appliesToTiers: editingCampaign.appliesToTiers || [],
        appliesToPromotionTypes: editingCampaign.appliesToPromotionTypes || [],
        minDurationDays: editingCampaign.minDurationDays,
        maxUses: editingCampaign.maxUses,
      });
    } else {
      // Reset form for new campaign
      setFormData({
        name: '',
        description: '',
        discountPercentage: 10,
        promoCode: '',
        bannerText: '',
        bannerEmoji: '🎉',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        appliesToTiers: [],
        appliesToPromotionTypes: [],
        minDurationDays: null,
        maxUses: null,
      });
    }
  }, [editingCampaign, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onSubmit(formData);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const toggleArrayItem = (field: 'appliesToTiers' | 'appliesToPromotionTypes', item: string) => {
    setFormData((prev) => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter((i) => i !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {editingCampaign ? 'Update campaign details' : 'Set up a promotional discount'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Christmas Sale 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discountPercentage: parseInt(e.target.value) || 0 }))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                  <span className="text-gray-600">% OFF</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this promotional campaign..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Campaign Duration</h3>

            {/* Single Campaign Note */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Only one campaign at a time</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Campaign discounts are automatically applied to all users. Date ranges cannot overlap with other active campaigns.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Display Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, bannerEmoji: emoji }))}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                      formData.bannerEmoji === emoji
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code (optional)
                </label>
                <input
                  type="text"
                  value={formData.promoCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., XMAS2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Text (optional)
                </label>
                <input
                  type="text"
                  value={formData.bannerText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bannerText: e.target.value }))}
                  placeholder="Custom banner message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Restrictions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Restrictions (Optional)</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applies to Pricing Tiers
              </label>
              <div className="flex flex-wrap gap-2">
                {PRICING_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleArrayItem('appliesToTiers', tier)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.appliesToTiers.includes(tier)
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to apply to all tiers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Applies to Promotion Types
              </label>
              <div className="flex flex-wrap gap-2">
                {PROMOTION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleArrayItem('appliesToPromotionTypes', type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      formData.appliesToPromotionTypes.includes(type)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to apply to all promotion types
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Duration (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minDurationDays || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    minDurationDays: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  placeholder="Any duration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    maxUses: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                  placeholder="Unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-3">Preview</h4>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{formData.bannerEmoji}</span>
              <div>
                <p className="font-bold text-green-800">
                  {formData.name || 'Campaign Name'}
                </p>
                <p className="text-sm text-green-700">
                  Extra {formData.discountPercentage}% OFF on all promotions!
                </p>
              </div>
              <span className="ml-auto px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-bold">
                -{formData.discountPercentage}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
