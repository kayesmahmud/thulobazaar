'use client';

import type { Ad } from './types';
import { getStatusBadge, getStatusLabel } from './types';

interface AdCardProps {
  ad: Ad;
  lang: string;
  actionLoading: boolean;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onRestore: () => void;
  onSoftDelete: () => void;
  onPermanentDelete: () => void;
}

export function AdCard({
  ad,
  lang,
  actionLoading,
  onSuspend,
  onUnsuspend,
  onRestore,
  onSoftDelete,
  onPermanentDelete,
}: AdCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow ${
        ad.deletedAt ? 'border-black opacity-75' : 'border-gray-200'
      }`}
    >
      <div className="p-6">
        <div className="flex gap-6">
          {/* Ad Image */}
          <div className="flex-shrink-0">
            {ad.primaryImage ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/ads/${ad.primaryImage}`}
                alt={ad.title}
                className="w-48 h-36 object-cover rounded-lg"
              />
            ) : (
              <div className="w-48 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>

          {/* Ad Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ad.status, ad.deletedAt)}`}>
                    {getStatusLabel(ad)}
                  </span>
                </div>
                <p className="text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                <AdMetadata ad={ad} />
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="mb-1">
                  {new Date(ad.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                {ad.deletedAt && (
                  <div className="text-xs text-red-600 font-semibold">
                    Deleted: {new Date(ad.deletedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            {ad.user && <UserInfo user={ad.user} />}

            {/* Status Reason */}
            {ad.statusReason && <StatusReason status={ad.status} reason={ad.statusReason} />}

            {/* Action Buttons */}
            <AdActions
              ad={ad}
              lang={lang}
              actionLoading={actionLoading}
              onSuspend={onSuspend}
              onUnsuspend={onUnsuspend}
              onRestore={onRestore}
              onSoftDelete={onSoftDelete}
              onPermanentDelete={onPermanentDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdMetadata({ ad }: { ad: Ad }) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
      <span className="flex items-center gap-1">
        <span>🆔</span> ID: {ad.id}
      </span>
      <span className="flex items-center gap-1">
        <span>🏷️</span> {ad.categoryName || 'N/A'}
      </span>
      <span className="flex items-center gap-1">
        <span>📍</span> {ad.locationName || 'N/A'}
      </span>
      <span className="flex items-center gap-1">
        <span>💰</span> NPR {ad.price?.toLocaleString()}
      </span>
      <span className="flex items-center gap-1">
        <span>📦</span> {ad.condition}
      </span>
      <span className="flex items-center gap-1">
        <span>👁️</span> {ad.viewCount} views
      </span>
    </div>
  );
}

function UserInfo({ user }: { user: NonNullable<Ad['user']> }) {
  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">User:</span>
        <span>{user.fullName}</span>
        <span className="text-gray-500">({user.email})</span>
        {user.businessVerified && <span className="text-blue-600">✓ Business</span>}
        {user.individualVerified && <span className="text-green-600">✓ Individual</span>}
      </div>
    </div>
  );
}

function StatusReason({ status, reason }: { status: string; reason: string }) {
  return (
    <div className={`mb-3 p-3 border rounded-lg text-sm ${
      status === 'suspended'
        ? 'bg-orange-50 border-orange-200 text-orange-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <span className="font-medium">Reason:</span> {reason}
    </div>
  );
}

interface AdActionsProps {
  ad: Ad;
  lang: string;
  actionLoading: boolean;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onRestore: () => void;
  onSoftDelete: () => void;
  onPermanentDelete: () => void;
}

function AdActions({
  ad,
  lang,
  actionLoading,
  onSuspend,
  onUnsuspend,
  onRestore,
  onSoftDelete,
  onPermanentDelete,
}: AdActionsProps) {
  return (
    <div className="flex gap-2 mt-4 flex-wrap">
      <button
        onClick={() => window.open(`/${lang}/ad/${ad.slug || ad.id}`, '_blank')}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
      >
        👁️ View
      </button>

      {/* Suspend Button (for non-suspended, non-deleted ads) */}
      {ad.status !== 'suspended' && !ad.deletedAt && (
        <button
          onClick={onSuspend}
          disabled={actionLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
        >
          ⏸️ Suspend
        </button>
      )}

      {/* Unsuspend Button (for suspended ads) */}
      {ad.status === 'suspended' && !ad.deletedAt && (
        <button
          onClick={onUnsuspend}
          disabled={actionLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
        >
          ▶️ Unsuspend
        </button>
      )}

      {/* Restore Button (for deleted ads) */}
      {ad.deletedAt && (
        <button
          onClick={onRestore}
          disabled={actionLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
        >
          ♻️ Restore
        </button>
      )}

      {/* Soft Delete Button (for non-deleted ads) */}
      {!ad.deletedAt && (
        <button
          onClick={onSoftDelete}
          disabled={actionLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
        >
          🗑️ Delete
        </button>
      )}

      {/* Permanent Delete Button (always shown) */}
      <button
        onClick={onPermanentDelete}
        disabled={actionLoading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-semibold"
      >
        ❌ Delete Forever
      </button>
    </div>
  );
}
