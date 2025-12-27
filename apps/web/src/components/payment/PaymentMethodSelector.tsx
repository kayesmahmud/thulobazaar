'use client';

import { useState } from 'react';
import type { PaymentGateway } from '@/lib/paymentGateways/types';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentGateway | null;
  onSelect: (method: PaymentGateway) => void;
  amount: number;
  disabled?: boolean;
  showTestInfo?: boolean;
}

/**
 * Mobile-responsive payment method selector
 * Displays Khalti and eSewa options with brand colors and logos
 */
export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  amount,
  disabled = false,
  showTestInfo = false,
}: PaymentMethodSelectorProps) {
  const [expanded, setExpanded] = useState<PaymentGateway | null>(null);

  const paymentMethods = [
    {
      id: 'khalti' as PaymentGateway,
      name: 'Khalti',
      tagline: 'Digital Wallet & Banking',
      color: 'from-purple-600 to-purple-700',
      selectedColor: 'from-purple-600 to-purple-700',
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>
        </svg>
      ),
      features: ['Khalti Wallet', 'Mobile Banking', 'Cards', 'Connect IPS'],
      testCredentials: {
        id: '9800000000-9800000005',
        mpin: '1111',
        otp: '987654',
      },
    },
    {
      id: 'esewa' as PaymentGateway,
      name: 'eSewa',
      tagline: 'Nepal\'s First Digital Wallet',
      color: 'from-green-500 to-green-600',
      selectedColor: 'from-green-500 to-green-600',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      ),
      features: ['eSewa Wallet', 'Bank Transfer', 'Quick Pay'],
      testCredentials: {
        id: '9806800001-9806800005',
        password: 'Nepal@123',
        otp: '123456',
      },
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm sm:text-base font-semibold text-gray-800">
          Select Payment Method
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Secure</span>
        </div>
      </div>

      {/* Payment Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isExpanded = expanded === method.id;

          return (
            <div key={method.id} className="relative">
              {/* Main Selection Button */}
              <button
                type="button"
                onClick={() => {
                  if (!disabled) {
                    onSelect(method.id);
                    setExpanded(isExpanded ? null : method.id);
                  }
                }}
                disabled={disabled}
                className={`
                  w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                    ? `${method.borderColor} ${method.bgColor} shadow-md`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Logo/Icon */}
                  <div className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${method.color} text-white shadow-lg
                  `}>
                    {method.id === 'khalti' ? (
                      <span className="text-xl sm:text-2xl font-bold">K</span>
                    ) : (
                      <span className="text-xl sm:text-2xl font-bold">e</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-base sm:text-lg ${isSelected ? method.textColor : 'text-gray-800'}`}>
                        {method.name}
                      </span>
                      {isSelected && (
                        <span className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {method.tagline}
                    </p>
                  </div>

                  {/* Expand Arrow (Mobile) */}
                  <div className="sm:hidden">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Features - Always visible on desktop */}
                <div className={`
                  mt-3 pt-3 border-t border-gray-100
                  hidden sm:block
                `}>
                  <div className="flex flex-wrap gap-1.5">
                    {method.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className={`
                          px-2 py-0.5 rounded-full text-xs
                          ${isSelected ? `${method.bgColor} ${method.textColor}` : 'bg-gray-100 text-gray-600'}
                        `}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {/* Expandable Features (Mobile Only) */}
              <div className={`
                sm:hidden overflow-hidden transition-all duration-200
                ${isExpanded && isSelected ? 'max-h-40 mt-2' : 'max-h-0'}
              `}>
                <div className={`p-3 rounded-lg ${method.bgColor}`}>
                  <p className="text-xs font-medium text-gray-600 mb-2">Payment Options:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {method.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-full text-xs bg-white ${method.textColor}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test Credentials (Development Only) */}
              {showTestInfo && isSelected && (
                <div className="mt-2 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-1.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sandbox Test Credentials
                  </p>
                  <div className="text-xs text-yellow-700 space-y-0.5">
                    <p><span className="font-medium">ID:</span> {method.testCredentials.id}</p>
                    {method.testCredentials.password && (
                      <p><span className="font-medium">Password:</span> {method.testCredentials.password}</p>
                    )}
                    {method.testCredentials.mpin && (
                      <p><span className="font-medium">MPIN:</span> {method.testCredentials.mpin}</p>
                    )}
                    <p><span className="font-medium">OTP:</span> {method.testCredentials.otp}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Amount Display */}
      {amount > 0 && selectedMethod && (
        <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount to Pay</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              NPR {amount.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Security Badge */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>256-bit SSL Encrypted</span>
      </div>
    </div>
  );
}
