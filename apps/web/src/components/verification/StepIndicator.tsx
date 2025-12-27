'use client';

export type Step = 'form' | 'payment';

interface StepIndicatorProps {
  currentStep: Step;
  theme?: 'blue' | 'rose' | 'emerald';
}

const themeColors = {
  blue: {
    active: 'bg-white text-indigo-600',
    inactive: 'bg-white/30 text-white',
  },
  rose: {
    active: 'bg-white text-rose-600',
    inactive: 'bg-white/30 text-white',
  },
  emerald: {
    active: 'bg-white text-emerald-600',
    inactive: 'bg-white/30 text-white',
  },
};

export default function StepIndicator({ currentStep, theme = 'blue' }: StepIndicatorProps) {
  const colors = themeColors[theme];

  return (
    <div className="flex items-center gap-2 mt-4">
      {/* Step 1: Fill Details */}
      <div className={`flex items-center gap-1.5 ${currentStep === 'form' ? 'opacity-100' : 'opacity-60'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep === 'form' ? colors.active : colors.inactive
        }`}>
          1
        </span>
        <span className="text-sm hidden sm:inline">Fill Details</span>
      </div>

      {/* Connector */}
      <div className="w-8 h-0.5 bg-white/30" />

      {/* Step 2: Payment */}
      <div className={`flex items-center gap-1.5 ${currentStep === 'payment' ? 'opacity-100' : 'opacity-60'}`}>
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep === 'payment' ? colors.active : colors.inactive
        }`}>
          2
        </span>
        <span className="text-sm hidden sm:inline">Payment</span>
      </div>
    </div>
  );
}
