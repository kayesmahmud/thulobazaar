'use client';

import { useState } from 'react';
import ReportAdModal from './ReportAdModal';

interface ReportAdButtonProps {
  adId: number;
  adTitle: string;
  lang: string;
}

export default function ReportAdButton({ adId, adTitle, lang }: ReportAdButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-gray-500 hover:text-red-600 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-1.5 group"
      >
        <span className="group-hover:scale-110 transition-transform">🚩</span>
        <span className="group-hover:underline">Report this ad</span>
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
