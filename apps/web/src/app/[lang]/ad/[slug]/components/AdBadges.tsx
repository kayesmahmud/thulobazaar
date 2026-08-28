import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCategoryPolicy } from '@thulobazaar/types';
import type { AdBadgesProps } from './types';

export async function AdBadges({
  lastEditedAt,
  categoryLinks,
  condition,
  isNegotiable,
  isCodAvailable,
  categorySlug,
  parentCategorySlug,
  fullCategory,
  isFeatured,
  featuredUntil,
  isUrgent,
  urgentUntil,
  isSticky,
  stickyUntil,
}: AdBadgesProps) {
  const t = await getTranslations('ads');

  // Old clients stamped condition and COD onto every ad in every category, so
  // rentals, jobs and live animals still carry them. The policy decides what
  // the category actually offers; the stored values stay untouched.
  const policy = getCategoryPolicy(
    parentCategorySlug || categorySlug || '',
    parentCategorySlug ? categorySlug || undefined : undefined
  );

  return (
    <div className="flex gap-2 mb-8 flex-wrap">
      {/* Edited Badge (owner edited the ad after it went live) */}
      {lastEditedAt && (
        <span
          className="px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm bg-gray-100 text-gray-700 inline-flex items-center gap-1"
          title={new Date(lastEditedAt).toLocaleString()}
        >
          ✏️ {t('edited')}
        </span>
      )}

      {/* Condition Badge */}
      {policy.condition !== 'hidden' && condition && (
        condition.toLowerCase() === 'brand new' ? (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('brandNew')}
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            {t('used')}
          </span>
        )
      )}

      {policy.negotiable && isNegotiable && (
        <span className="bg-amber-50 text-amber-900 px-3 py-1 rounded text-sm font-semibold">
          {t('priceIsNegotiable')}
        </span>
      )}

      {/* Deeper orange than negotiable so COD stands out as the stronger
          buying signal, while still reading as the same family of badge. */}
      {policy.cod && isCodAvailable && (
        <span className="bg-orange-100 text-orange-900 px-3 py-1 rounded text-sm font-semibold">
          {t('cashOnDeliveryAvailable')}
        </span>
      )}

      {categoryLinks && categoryLinks.length > 0 ? (
        <span className="bg-green-50 text-green-800 px-3 py-1 rounded text-sm">
          {categoryLinks.map((link, i) => (
            <span key={link.href}>
              {i > 0 && ' > '}
              <Link
                href={link.href}
                className="hover:underline hover:text-green-900 font-medium"
              >
                {link.name}
              </Link>
            </span>
          ))}
        </span>
      ) : (
        fullCategory && (
          <span className="bg-green-50 text-green-800 px-3 py-1 rounded text-sm">
            {fullCategory}
          </span>
        )
      )}

      {isFeatured && featuredUntil && new Date(featuredUntil) > new Date() && (
        <span style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(251, 191, 36, 0.3)'
        }}>
          {t('featured')}
        </span>
      )}

      {isUrgent && urgentUntil && new Date(urgentUntil) > new Date() && (
        <span style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          {t('urgentSale')}
        </span>
      )}

      {isSticky && stickyUntil && new Date(stickyUntil) > new Date() && (
        <span style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
        }}>
          {t('sticky')}
        </span>
      )}
    </div>
  );
}
