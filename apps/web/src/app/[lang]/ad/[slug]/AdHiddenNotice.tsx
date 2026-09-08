import Link from 'next/link';
import { Clock, EyeOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

/**
 * Shown in place of an ad that exists but is not public: a pending one (the
 * seller just edited it and it went back to review) or one that is rejected,
 * expired or removed. Mirrors the app's hidden-ad screen and the API's 404
 * reason codes, so the website never reveals more than the app does.
 */
export default async function AdHiddenNotice({
  lang,
  pending,
}: {
  lang: string;
  pending: boolean;
}) {
  const t = await getTranslations('ads');
  const Icon = pending ? Clock : EyeOff;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            pending ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {pending ? t('pendingAfterEditTitle') : t('unavailableTitle')}
        </h1>
        <p className="text-gray-600 mb-6">
          {pending ? t('pendingAfterEditBody') : t('unavailableBody')}
        </p>
        <Link
          href={`/${lang}/ads`}
          className="inline-block px-6 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors"
        >
          {t('browseOtherAds')}
        </Link>
      </div>
    </div>
  );
}
