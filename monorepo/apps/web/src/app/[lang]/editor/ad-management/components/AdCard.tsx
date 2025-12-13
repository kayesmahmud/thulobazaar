'use client';

import {
  CheckCircle,
  XCircle,
  PauseCircle,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { getStatusBadge, getAvailableActions } from '@/utils/editorUtils';
import type { Ad } from '../types';

interface AdCardProps {
  ad: Ad;
  lang: string;
  actions: {
    loading: boolean;
    handleApprove: (id: number) => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
    handleUnsuspend: (id: number) => Promise<void>;
    handleRestore: (id: number) => Promise<void>;
  };
  onReject: (ad: Ad) => void;
  onSuspend: (ad: Ad) => void;
  onPermanentDelete: (ad: Ad) => void;
}

export default function AdCard({
  ad,
  lang,
  actions,
  onReject,
  onSuspend,
  onPermanentDelete,
}: AdCardProps) {
  const availableActions = getAvailableActions(ad);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-shadow ${
        ad.deletedAt ? 'border-gray-400 opacity-75' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="p-6">
        <div className="flex gap-6">
          {/* Ad Image */}
          <div className="flex-shrink-0">
            {ad.images && ad.images.length > 0 ? (
              <img
                src={`/${ad.images[0]}`}
                alt={ad.title}
                className="w-48 h-36 object-cover rounded-lg"
              />
            ) : (
              <div className="w-48 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
          </div>

          {/* Ad Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ad.status)}`}>
                    {ad.status.toUpperCase()}
                  </span>
                  {ad.deletedAt && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-200">
                      DELETED
                    </span>
                  )}
                </div>
                <p className="text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">🏷️ {ad.category}</span>
                  <span className="flex items-center gap-1">📍 {ad.location}</span>
                  <span className="flex items-center gap-1">💰 NPR {ad.price?.toLocaleString()}</span>
                  {ad.condition && <span className="flex items-center gap-1">📦 {ad.condition}</span>}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>ID: #{ad.id}</div>
                <div className="mt-1">
                  {new Date(ad.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            {ad.sellerName && (
              <div className="mb-3 text-sm text-gray-600">
                <span className="font-medium">Seller:</span> {ad.sellerName}
                {ad.sellerPhone && <span className="ml-2">📞 {ad.sellerPhone}</span>}
              </div>
            )}

            {/* Status Messages */}
            {ad.status === 'rejected' && ad.statusReason && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <span className="font-medium">Rejection Reason:</span> {ad.statusReason}
              </div>
            )}

            {ad.status === 'suspended' && ad.statusReason && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                <span className="font-medium">Suspension Reason:</span> {ad.statusReason}
                {ad.suspendedUntil && (
                  <div className="mt-1">
                    <span className="font-medium">Suspended Until:</span>{' '}
                    {new Date(ad.suspendedUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {ad.deletedAt && (
              <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                <span className="font-medium">Deleted At:</span>{' '}
                {new Date(ad.deletedAt).toLocaleDateString()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={() => window.open(`/${lang}/ad/${ad.slug}`, '_blank')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Eye size={16} />
                View Details
              </button>

              {availableActions.includes('approve') && (
                <button
                  onClick={() => actions.handleApprove(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
              )}

              {availableActions.includes('reject') && (
                <button
                  onClick={() => onReject(ad)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              )}

              {availableActions.includes('suspend') && (
                <button
                  onClick={() => onSuspend(ad)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <PauseCircle size={16} />
                  Suspend
                </button>
              )}

              {availableActions.includes('unsuspend') && (
                <button
                  onClick={() => actions.handleUnsuspend(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Unsuspend
                </button>
              )}

              {availableActions.includes('restore') && (
                <button
                  onClick={() => actions.handleRestore(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Restore
                </button>
              )}

              {availableActions.includes('delete') && (
                <button
                  onClick={() => actions.handleDelete(ad.id)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}

              {availableActions.includes('permanentDelete') && (
                <button
                  onClick={() => onPermanentDelete(ad)}
                  disabled={actions.loading}
                  className="px-4 py-2 bg-red-900 text-white rounded-lg hover:bg-red-950 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <AlertTriangle size={16} />
                  Delete Forever
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
