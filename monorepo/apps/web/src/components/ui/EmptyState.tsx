import Link from 'next/link';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {/* Animated Icon */}
      <div className="text-8xl mb-6 animate-bounce-slow inline-block">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel && actionHref) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center gap-2 bg-rose-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 no-underline"
          >
            {actionLabel}
          </Link>

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 no-underline"
            >
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
export function EmptyAds({ lang }: { lang: string }) {
  return (
    <EmptyState
      icon="📭"
      title="No ads yet"
      description="Start building your presence on ThuLoBazaar by posting your first ad. It's free and takes just a few minutes!"
      actionLabel="+ Post Your First Ad"
      actionHref={`/${lang}/post-ad`}
      secondaryActionLabel="Browse All Ads"
      secondaryActionHref={`/${lang}/all-ads`}
    />
  );
}

export function EmptySearchResults({ lang }: { lang: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description="We couldn't find any ads matching your search. Try adjusting your filters or search terms."
      actionLabel="Clear Filters"
      actionHref={`/${lang}/search`}
      secondaryActionLabel="Browse All Ads"
      secondaryActionHref={`/${lang}/all-ads`}
    />
  );
}

export function EmptyFavorites({ lang }: { lang: string }) {
  return (
    <EmptyState
      icon="❤️"
      title="No favorites yet"
      description="Save ads you love by clicking the heart icon. Your favorites will appear here for easy access."
      actionLabel="Browse Ads"
      actionHref={`/${lang}/all-ads`}
    />
  );
}

export function EmptyMessages() {
  return (
    <EmptyState
      icon="💬"
      title="No messages"
      description="When buyers contact you about your ads or you reach out to sellers, your conversations will appear here."
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="🔔"
      title="No notifications"
      description="Stay updated! You'll receive notifications about your ads, messages, and account activity here."
    />
  );
}

export function ErrorState({
  message = "Something went wrong",
  retry
}: {
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-8xl mb-6">😕</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Oops!
      </h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        {message}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 bg-rose-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          🔄 Try Again
        </button>
      )}
    </div>
  );
}
