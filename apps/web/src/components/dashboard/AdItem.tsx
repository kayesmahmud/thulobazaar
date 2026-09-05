'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { formatPrice, formatDateTime } from '@thulobazaar/utils';
import { StatusBadge } from '@/components/ui';
import { getImageUrl } from '@/lib/images/imageUrl';
import { PromoteAdModal } from '@/components/promotion';
import type { Ad } from './types';

interface AdItemProps {
  ad: Ad;
  lang: string;
  onDelete: (adId: number) => Promise<void>;
}

/** Codes with a dedicated translation; anything else gets the generic line. */
const AI_HOLD_CODES = new Set([
  'stock_photo',
  'unclear_photos',
  'details_mismatch',
  'suspicious_price',
  'duplicate',
  'policy_check',
]);

export function AdItem({ ad, lang, onDelete }: AdItemProps) {
  const router = useRouter();
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');

  return (
    <>
    <div className="group flex flex-row flex-wrap md:flex-nowrap md:items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50">
      {/* Thumbnail Image */}
      <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative shadow-md group-hover:shadow-xl transition-shadow duration-300">
        {ad.images && ad.images.length > 0 ? (
          <Image
            src={getImageUrl(ad.images[0]?.file_path || ad.images[0]?.filePath || ad.images[0]?.filename, 'ads') || ''}
            alt={ad.title}
            fill
            unoptimized
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="112px"
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
          className="text-gray-900 no-underline font-bold text-sm md:text-lg hover:text-indigo-600 transition-colors line-clamp-1 md:line-clamp-2 block mb-1 md:mb-2"
        >
          {ad.title}
        </Link>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap text-xs md:text-sm">
          <StatusBadge status={ad.status} size="sm" showIcon />
          <div className="flex items-center gap-1 md:gap-2 text-gray-500">
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden md:inline">{formatDateTime(new Date(ad.createdAt))}</span>
            <span className="md:hidden">{new Date(ad.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-gray-500">
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <span>{ad.views || 0}</span>
          </div>
        </div>

        {/* AI hold reason: the AI couldn't auto-approve and says why — mapped
            from the whitelisted code (never raw AI text). Editors act next. */}
        {ad.status === 'pending' && ad.aiHeld && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-violet-200 bg-violet-50 p-3">
            <span className="shrink-0 text-base leading-5">✨</span>
            <div>
              <p className="m-0 text-sm leading-relaxed text-violet-900">
                {t(
                  ad.aiReasonCode &&
                    AI_HOLD_CODES.has(ad.aiReasonCode)
                    ? `aiHold_${ad.aiReasonCode}`
                    : 'aiHold_generic'
                )}
              </p>
              {ad.aiSuggestedCategory && (
                <p className="m-0 mt-1.5 inline-block rounded-md bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-800">
                  {t('aiHold_tryCategory', { category: ad.aiSuggestedCategory })}
                </p>
              )}
              <Link
                href={`/${lang}/edit-ad/${ad.id}`}
                className="mt-1.5 inline-block text-sm font-semibold text-violet-700 hover:text-violet-900 hover:underline"
              >
                {t('aiHold_editNudge')}
              </Link>
            </div>
          </div>
        )}

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
                  <p className="text-sm font-bold text-red-900">{t('adRejected')}</p>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    {t('needsAttention')}
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-800 mb-1">{t('reasonFromEditor')}</p>
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
                      <p className="font-semibold mb-1">{t('nextSteps')}</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>{t('fixIssues')}</li>
                        <li>{t('clickEditResubmit')}</li>
                        <li>{t('autoSentForReview')}</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price and Actions - Responsive layout */}
      <div className="w-full md:w-auto flex flex-col gap-2 md:gap-3 md:flex-row md:items-center md:gap-4">
        {/* Price */}
        <div className="flex items-center justify-between md:justify-end md:text-right">
          <span className="text-[10px] text-gray-500 md:hidden">{t('price')}</span>
          <div>
            <div className="hidden md:block text-xs text-gray-500 mb-1">{t('price')}</div>
            <div className="text-base md:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatPrice(ad.price)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 md:gap-2">
          {/* Active ads: Promote on top, View/Sold/Delete in row below */}
          {ad.status === 'active' && (
            <>
              {/* Promote button - Full width, prominent */}
              <button
                onClick={() => setShowPromoteModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-3 px-3 md:px-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white border-none rounded-lg md:rounded-xl cursor-pointer text-xs md:text-base font-semibold hover:from-purple-600 hover:via-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                title={t('promote')}
              >
                <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{t('promote')}</span>
              </button>

              {/* View, Edit and Delete buttons */}
              <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                <Link
                  href={`/${lang}/ad/${ad.slug}`}
                  className="inline-flex items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2 px-1.5 md:px-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md md:rounded-lg no-underline text-[10px] md:text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                  title={t('view')}
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{t('view')}</span>
                </Link>
                <Link
                  href={`/${lang}/edit-ad/${ad.id}`}
                  className="inline-flex items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2 px-1.5 md:px-2 bg-gray-100 text-gray-700 rounded-md md:rounded-lg no-underline text-[10px] md:text-sm font-medium hover:bg-gray-200 transition-colors"
                  title={t('edit')}
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{t('edit')}</span>
                </Link>
                <button
                  onClick={() => onDelete(ad.id)}
                  className="inline-flex items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2 px-1.5 md:px-2 bg-red-50 text-red-600 border border-red-200 rounded-md md:rounded-lg cursor-pointer text-[10px] md:text-sm font-medium hover:bg-red-100 transition-colors"
                  title={t('delete')}
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{t('delete')}</span>
                </button>
              </div>
            </>
          )}

          {/* Non-active ads: View and Edit/Delete buttons */}
          {ad.status !== 'active' && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${lang}/ad/${ad.slug}`}
                className="inline-flex items-center justify-center gap-1 py-2 px-2.5 md:px-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg no-underline text-xs md:text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                title={t('view')}
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">{t('view')}</span>
              </Link>
              <Link
                href={`/${lang}/edit-ad/${ad.id}`}
                className={`inline-flex items-center justify-center gap-1 py-2 px-2.5 md:px-3 rounded-lg no-underline text-xs md:text-sm font-medium transition-colors ${
                  ad.status === 'rejected'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={ad.status === 'rejected' ? t('editResubmit') : t('edit')}
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">{ad.status === 'rejected' ? t('editResubmit') : t('edit')}</span>
              </Link>

              <button
                onClick={() => onDelete(ad.id)}
                className="inline-flex items-center justify-center gap-1 py-2 px-2.5 md:px-3 bg-red-50 text-red-600 border-none rounded-lg cursor-pointer text-xs md:text-sm font-medium hover:bg-red-100 transition-colors"
                title={t('delete')}
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">{t('delete')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Promote Modal */}
    {showPromoteModal && (
      <PromoteAdModal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        ad={{
          id: ad.id,
          title: ad.title,
        }}
        onPromote={() => {
          setShowPromoteModal(false);
          router.refresh();
        }}
      />
    )}
    </>
  );
}
