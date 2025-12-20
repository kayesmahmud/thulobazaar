'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { StatusBadge } from '@/components/ui';
import { getImageUrl } from '@/lib/images/imageUrl';
import type { Ad } from './types';

interface AdItemProps {
  ad: Ad;
  lang: string;
  onDelete: (adId: number) => Promise<void>;
  onMarkAsSold: (adId: number) => Promise<void>;
}

export function AdItem({ ad, lang, onDelete, onMarkAsSold }: AdItemProps) {
  return (
    <div className="group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50">
      {/* Thumbnail Image */}
      <div className="w-full md:w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative shadow-md group-hover:shadow-xl transition-shadow duration-300">
        {ad.images && ad.images.length > 0 ? (
          <Image
            src={getImageUrl(ad.images[0]?.file_path || ad.images[0]?.filePath || ad.images[0]?.filename, 'ads') || ''}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="112px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Ad Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/${lang}/ad/${ad.slug}`}
          className="text-gray-900 no-underline font-bold text-lg hover:text-indigo-600 transition-colors line-clamp-2 block mb-2"
        >
          {ad.title}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={ad.status} size="sm" showIcon />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDateTime(new Date(ad.created_at))}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{ad.views || 0} views</span>
          </div>
        </div>

        {/* Rejection Reason - Enhanced */}
        {ad.status === 'rejected' && ad.statusReason && (
          <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-bold text-red-900">Ad Rejected</p>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    Needs Attention
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-800 mb-1">Reason from editor:</p>
                <p className="text-sm text-red-700 bg-white/60 p-2 rounded border border-red-200">
                  {ad.statusReason}
                </p>

                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">Next Steps:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Fix the issues mentioned above</li>
                        <li>Click "Edit & Resubmit" below</li>
                        <li>Your ad will be automatically sent for review again</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Price</div>
          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {formatPrice(ad.price)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/${lang}/ad/${ad.slug}`}
            className="inline-flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl no-underline text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View
          </Link>
          <div className="flex gap-2">
            {/* Only show Edit button for non-approved ads */}
            {!ad.isApproved && (
              <Link
                href={`/${lang}/edit-ad/${ad.id}`}
                className={`inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg no-underline text-sm font-medium transition-colors ${
                  ad.status === 'rejected'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={
                  ad.status === 'rejected' ? 'Fix issues and resubmit for review' : 'Edit this ad'
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {ad.status === 'rejected' ? 'Edit & Resubmit' : 'Edit'}
              </Link>
            )}
            {/* Show Mark as Sold and Delete buttons for approved ads */}
            {ad.isApproved && (
              <>
                <button
                  onClick={() => onMarkAsSold(ad.id)}
                  className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none rounded-lg cursor-pointer text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                  title="Mark this ad as sold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Mark as Sold
                </button>
                <button
                  onClick={() => onDelete(ad.id)}
                  className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg cursor-pointer text-sm font-medium hover:bg-red-100 transition-colors"
                  title="Delete this ad"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </>
            )}
            {/* Show only Delete button for non-approved ads */}
            {!ad.isApproved && (
              <button
                onClick={() => onDelete(ad.id)}
                className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-red-50 text-red-600 border-none rounded-lg cursor-pointer text-sm font-medium hover:bg-red-100 transition-colors"
                title="Delete this ad"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
