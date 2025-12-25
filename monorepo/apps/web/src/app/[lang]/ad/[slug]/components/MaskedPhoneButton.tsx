'use client';

import { useState } from 'react';

interface MaskedPhoneButtonProps {
  phone: string;
}

export function MaskedPhoneButton({ phone }: MaskedPhoneButtonProps) {
  const [revealed, setRevealed] = useState(false);

  // Mask last 3 digits: 9841234567 -> 9841234XXX
  const maskedPhone = phone.length > 3
    ? phone.slice(0, -3) + 'XXX'
    : phone;

  const handleClick = () => {
    if (!revealed) {
      setRevealed(true);
    } else {
      // If already revealed, make the call
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="block w-full px-3 py-3 bg-emerald-500 text-white rounded-lg font-semibold mb-3 text-center no-underline transition-all duration-200 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0"
    >
      {revealed ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {phone}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {maskedPhone}
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Click to reveal</span>
        </span>
      )}
    </button>
  );
}
