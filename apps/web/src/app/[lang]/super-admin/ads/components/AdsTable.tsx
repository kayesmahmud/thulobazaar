'use client';

import type { Ad } from '../types';
import { getStatusBadgeClass, formatDate } from '../types';

interface AdsTableProps {
  ads: Ad[];
  lang: string;
  page: number;
  totalPages: number;
  totalAds: number;
  actionLoading: number | null;
  onPageChange: (page: number) => void;
  onApprove: (adId: number) => void;
  onReject: (adId: number) => void;
}

export default function AdsTable({
  ads,
  lang,
  page,
  totalPages,
  totalAds,
  actionLoading,
  onPageChange,
  onApprove,
  onReject,
}: AdsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Ad Details</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Seller</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Price</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Created</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-lg">No ads found</div>
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-indigo-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">{ad.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{ad.description}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {ad.category_name}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {ad.location_name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{ad.seller_name}</div>
                      <div className="text-gray-500">{ad.seller_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      NPR {ad.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(ad.status)}`}>
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{formatDate(ad.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {ad.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApprove(ad.id)}
                            disabled={actionLoading === ad.id}
                            className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === ad.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => onReject(ad.id)}
                            disabled={actionLoading === ad.id}
                            className="px-3 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === ad.id ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => window.open(`/${lang}/ad/${ad.id}`, '_blank')}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages} ({totalAds} total ads)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
