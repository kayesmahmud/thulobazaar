'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUserAuth } from '@/contexts/UserAuthContext';
import ReportAdModal from './ReportAdModal';

interface ReportAdButtonProps {
  adId: number;
  adTitle: string;
  lang: string;
  /** Owner of the ad; the link is hidden when the viewer owns it. */
  sellerId: number | null;
}

/**
 * Plain-text "Report this ad" link. Deliberately no icon: many users do not
 * recognise a flag glyph, but everyone can read the words.
 */
export default function ReportAdButton({ adId, adTitle, lang, sellerId }: ReportAdButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('ads');
  const { user } = useUserAuth();

  const isOwner = user?.id != null && sellerId != null && String(user.id) === String(sellerId);
  if (isOwner) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="text-sm font-semibold text-red-600 hover:underline cursor-pointer min-h-[44px] px-1 shrink-0"
      >
        {t('reportThisAd')}
      </button>

      <ReportAdModal
        adId={adId}
        adTitle={adTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />
    </>
  );
}
