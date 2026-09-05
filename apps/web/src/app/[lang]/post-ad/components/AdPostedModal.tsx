'use client';

import { useTranslations } from 'next-intl';

/** Hold reasons we have written copy for. Anything else from the server —
    including 'other' — falls back to the neutral 'generic' message, which
    never blames the seller (a missing code usually means the AI was down). */
const HOLD_CODES = [
  'stock_photo',
  'unclear_photos',
  'details_mismatch',
  'suspicious_price',
  'duplicate',
  'policy_check',
] as const;

interface AdPostedModalProps {
  lang: string;
  /** The ad already went live (business direct-publish or instant AI
      approval) — closing goes to the ad's page instead of the dashboard. */
  live?: boolean;
  /** Seller-facing AI hold reason, once the verdict has landed. */
  holdCode?: string | null;
  /** Real category the AI suggests instead — already validated server-side
      against the category tree, so it is safe to show verbatim. */
  suggestedCategory?: string | null;
  /** False while the AI verdict is still outstanding. */
  resolved?: boolean;
  onFix: () => void;
  onClose: () => void;
}

export function AdPostedModal({
  lang,
  live = false,
  holdCode = null,
  suggestedCategory = null,
  resolved = false,
  onFix,
  onClose,
}: AdPostedModalProps) {
  const t = useTranslations('ads');

  const held = !live && holdCode !== null;
  const checking = !live && !held && !resolved;
  const reasonKey =
    holdCode && (HOLD_CODES as readonly string[]).includes(holdCode) ? holdCode : 'generic';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 pb-8 pt-10 text-center shadow-2xl">
        {/* Prominent close button — the only way to dismiss */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-600"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {checking ? (
          /* Verdict still outstanding — the modal flips in place when it lands */
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-gray-200 border-t-emerald-500 motion-safe:animate-spin"
            role="status"
            aria-live="polite"
          />
        ) : held ? (
          /* Amber pause — held is "wait", not "rejected" */
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
        ) : (
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}

        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          {checking
            ? t('adPostedChecking')
            : held
              ? t('adHeldTitle')
              : t(live ? 'adPostedLiveTitle' : 'adPostedTitle')}
        </h2>

        {held ? (
          <>
            <p className="mb-2 text-sm font-medium leading-relaxed text-gray-900">
              {t(`adHeld_${reasonKey}`)}
            </p>
            {suggestedCategory && (
              <p className="mb-0 mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                {t('adHeldTryCategory', { category: suggestedCategory })}
              </p>
            )}
            <p className="mb-0 mt-2 text-sm leading-relaxed text-gray-600">
              {t(reasonKey === 'generic' ? 'adHeldNoteGeneric' : 'adHeldNote')}
            </p>
            {lang !== 'ne' && reasonKey !== 'generic' && (
              <p className="mb-0 mt-3 text-[13px] italic leading-relaxed text-gray-500">
                {t('adHeldNoteLatin')}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t('adHeldOk')}
              </button>
              <button
                type="button"
                onClick={onFix}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                {t('adHeldEdit')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-0 text-sm leading-relaxed text-gray-700">
              {checking
                ? t('adPostedCheckingNote')
                : t(live ? 'adPostedLiveNote' : 'adHeldNoteGeneric')}
            </p>

            {/* Romanized Nepali line for the English locale (Nepali locale reads it natively above) */}
            {!live && !checking && lang !== 'ne' && (
              <p className="mb-0 mt-3 text-[13px] italic leading-relaxed text-gray-500">
                {t('adHeldNoteLatin')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
