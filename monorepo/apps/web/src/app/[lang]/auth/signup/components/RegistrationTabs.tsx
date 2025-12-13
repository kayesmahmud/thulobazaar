'use client';

import type { RegistrationType, PhoneStep } from './types';

interface RegistrationTabsProps {
  registrationType: RegistrationType;
  setRegistrationType: (type: RegistrationType) => void;
  setPhoneStep: (step: PhoneStep) => void;
  clearMessages: () => void;
}

export function RegistrationTabs({
  registrationType,
  setRegistrationType,
  setPhoneStep,
  clearMessages,
}: RegistrationTabsProps) {
  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => {
          setRegistrationType('phone');
          setPhoneStep('phone');
          clearMessages();
        }}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          registrationType === 'phone'
            ? 'bg-rose-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Phone Number
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          setRegistrationType('email');
          clearMessages();
        }}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          registrationType === 'email'
            ? 'bg-rose-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email
        </span>
      </button>
    </div>
  );
}
