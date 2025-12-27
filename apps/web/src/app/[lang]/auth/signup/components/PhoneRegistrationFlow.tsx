'use client';

import { Button } from '@/components/ui';
import type { PhoneStep, FormData } from './types';

interface PhoneRegistrationFlowProps {
  phoneStep: PhoneStep;
  setPhoneStep: (step: PhoneStep) => void;
  phone: string;
  setPhone: (phone: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  otpCooldown: number;
  otpExpiry: number;
  formData: FormData;
  setFormData: (data: FormData) => void;
  isLoading: boolean;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formatTime: (seconds: number) => string;
  clearMessages: () => void;
}

export function PhoneRegistrationFlow({
  phoneStep,
  setPhoneStep,
  phone,
  setPhone,
  otp,
  setOtp,
  otpCooldown,
  otpExpiry,
  formData,
  setFormData,
  isLoading,
  onSendOtp,
  onVerifyOtp,
  onSubmit,
  formatTime,
  clearMessages,
}: PhoneRegistrationFlowProps) {
  return (
    <div className="space-y-6">
      {/* Step 1: Phone Number */}
      {phoneStep === 'phone' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +977
              </span>
              <input
                id="phone"
                type="tel"
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={isLoading}
                maxLength={10}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Enter 10-digit Nepali mobile number (starting with 97 or 98)</p>
          </div>

          <Button
            type="button"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading || otpCooldown > 0 || phone.length !== 10}
            onClick={onSendOtp}
          >
            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
          </Button>
        </div>
      )}

      {/* Step 2: OTP Verification */}
      {phoneStep === 'otp' && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              OTP sent to <span className="font-medium">+977 {phone}</span>
            </p>
            {otpExpiry > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Expires in {formatTime(otpExpiry)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP *
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors text-center text-2xl tracking-widest"
              placeholder="------"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
              maxLength={6}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading || otp.length !== 6}
            onClick={onVerifyOtp}
          >
            Verify OTP
          </Button>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={() => {
                setPhoneStep('phone');
                setOtp('');
                clearMessages();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Change number
            </button>
            <button
              type="button"
              onClick={onSendOtp}
              disabled={isLoading || otpCooldown > 0}
              className="text-rose-500 hover:text-rose-600 disabled:text-gray-400"
            >
              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details Form */}
      {phoneStep === 'details' && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-center mb-4 pb-4 border-b border-gray-200">
            <div className="inline-flex items-center gap-2 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">+977 {phone} verified</span>
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500 mt-0.5"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                Terms & Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-rose-500 hover:text-rose-600 transition-colors">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      )}
    </div>
  );
}
