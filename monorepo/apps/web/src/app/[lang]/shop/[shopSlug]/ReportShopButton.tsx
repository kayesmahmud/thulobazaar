'use client';

import { useState } from 'react';
import ReportShopModal from './ReportShopModal';

interface ReportShopButtonProps {
  shopId: number;
  shopName: string;
  lang: string;
}

export default function ReportShopButton({ shopId, shopName, lang }: ReportShopButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-gray-500 hover:text-orange-600 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-1.5 group"
      >
        <span className="group-hover:scale-110 transition-transform">🚩</span>
        <span className="group-hover:underline">Report this shop</span>
      </button>

      <ReportShopModal
        shopId={shopId}
        shopName={shopName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lang={lang}
      />
    </>
  );
}
