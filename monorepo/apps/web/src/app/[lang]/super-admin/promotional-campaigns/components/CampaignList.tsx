'use client';

import { Campaign } from '../usePromotionalCampaigns';

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}

export function CampaignList({ campaigns, onEdit, onToggleActive, onDelete }: CampaignListProps) {
  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    if (!campaign.isActive) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-700' };
    }
    if (endDate < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-700' };
    }
    if (startDate > now) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-4xl mb-4">🎉</div>
        <p className="text-gray-500">No promotional campaigns found.</p>
        <p className="text-sm text-gray-400 mt-1">Create your first campaign to offer discounts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const status = getCampaignStatus(campaign);
        return (
          <div
            key={campaign.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Left: Campaign Info */}
              <div className="flex items-start gap-4 flex-1 min-w-[300px]">
                <div className="text-4xl">{campaign.bannerEmoji || '🎉'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-gray-800">{campaign.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {campaign.promoCode && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono">
                        {campaign.promoCode}
                      </span>
                    )}
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                    <span>
                      📅 {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </span>
                    <span className="text-xs">({getDaysRemaining(campaign.endDate)})</span>
                  </div>
                </div>
              </div>

              {/* Right: Discount & Stats */}
              <div className="flex items-center gap-6">
                {/* Discount Badge */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {campaign.discountPercentage}%
                  </div>
                  <div className="text-xs text-gray-500">OFF</div>
                </div>

                {/* Usage Stats */}
                {campaign.maxUses && (
                  <div className="text-center border-l pl-4">
                    <div className="text-lg font-semibold text-gray-700">
                      {campaign.currentUses || 0}/{campaign.maxUses}
                    </div>
                    <div className="text-xs text-gray-500">Uses</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-l pl-4">
                  <button
                    onClick={() => onEdit(campaign)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onToggleActive(campaign.id, !campaign.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      campaign.isActive
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={campaign.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {campaign.isActive ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to permanently delete this campaign? This action cannot be undone.')) {
                        onDelete(campaign.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete permanently"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Applies To Tags */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {campaign.appliesToTiers?.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Tiers:</span>
                  {campaign.appliesToTiers.map((tier) => (
                    <span key={tier} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                      {tier}
                    </span>
                  ))}
                </div>
              )}
              {campaign.appliesToPromotionTypes?.length > 0 && (
                <div className="flex items-center gap-1 ml-4">
                  <span className="text-xs text-gray-500">Types:</span>
                  {campaign.appliesToPromotionTypes.map((type) => (
                    <span key={type} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded text-xs capitalize">
                      {type}
                    </span>
                  ))}
                </div>
              )}
              {campaign.minDurationDays && (
                <span className="text-xs text-gray-500 ml-4">
                  Min duration: {campaign.minDurationDays} days
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
