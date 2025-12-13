'use client';

import type { PricingOption, VerificationPricing, VerificationType } from './types';

interface DurationSelectorProps {
  selectedType: VerificationType;
  selectedDuration: PricingOption | null;
  pricing: VerificationPricing;
  isFreeVerification: boolean;
  onDurationSelect: (option: PricingOption) => void;
  onProceed: () => void;
  onClear: () => void;
}

export function DurationSelector({
  selectedType,
  selectedDuration,
  pricing,
  isFreeVerification,
  onDurationSelect,
  onProceed,
  onClear,
}: DurationSelectorProps) {
  const options = selectedType === 'individual' ? pricing.individual : pricing.business;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Select Verification Duration
        </h2>
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Free Verification Notice */}
      {isFreeVerification && (
        <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <div className="font-bold text-green-800">You&apos;re Eligible for FREE Verification!</div>
              <div className="text-green-700 text-sm">
                Get {pricing.freeVerification.durationDays / 30} months free as a new user.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duration Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {options.map((option) => (
          <DurationOption
            key={option.id}
            option={option}
            isSelected={selectedDuration?.id === option.id}
            isFreeTier={isFreeVerification && option.durationDays === pricing.freeVerification.durationDays}
            onSelect={() => onDurationSelect(option)}
          />
        ))}
      </div>

      {/* Selected Summary & Proceed Button */}
      {selectedDuration && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-gray-600 mb-1">Selected Plan:</div>
              <div className="text-xl font-bold text-gray-900">
                {selectedType === 'individual' ? 'Individual' : 'Business'} Verification - {selectedDuration.durationLabel}
              </div>
              <div className="text-2xl font-bold text-indigo-600">
                {isFreeVerification ? 'FREE' : `NPR ${selectedDuration.finalPrice}`}
              </div>
            </div>
            <button
              onClick={onProceed}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span>Proceed to Verification</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DurationOptionProps {
  option: PricingOption;
  isSelected: boolean;
  isFreeTier: boolean;
  onSelect: () => void;
}

function DurationOption({ option, isSelected, isFreeTier, onSelect }: DurationOptionProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl scale-105'
          : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-indigo-300'
      }`}
    >
      {/* Popular/Recommended Badge */}
      {option.durationDays === 180 && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            POPULAR
          </span>
        </div>
      )}

      {/* Free Badge */}
      {isFreeTier && (
        <div className="absolute -top-3 right-4">
          <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            FREE
          </span>
        </div>
      )}

      <div className="text-center">
        <div className={`text-lg font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
          {option.durationLabel}
        </div>

        {isFreeTier ? (
          <div className="mb-2">
            <span className="text-3xl font-bold text-green-500">FREE</span>
            <div className={`text-sm line-through ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
              NPR {option.price}
            </div>
          </div>
        ) : (
          <div className="mb-2">
            {option.discountPercentage > 0 ? (
              <>
                <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
                  NPR {option.finalPrice}
                </span>
                <div className={`text-sm line-through ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                  NPR {option.price}
                </div>
              </>
            ) : (
              <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
                NPR {option.price}
              </span>
            )}
          </div>
        )}

        {option.discountPercentage > 0 && !isFreeTier && (
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
          }`}>
            Save {option.discountPercentage}%
          </div>
        )}
      </div>
    </div>
  );
}
