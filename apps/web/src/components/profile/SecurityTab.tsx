'use client';

import { useRef, useEffect, useState } from 'react';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';
import { signOut } from 'next-auth/react';

// OTP Input Component with individual digit boxes
interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  status?: 'idle' | 'success' | 'error';
  disabled?: boolean;
  autoFocus?: boolean;
}

function OtpInput({
  value,
  onChange,
  length = 6,
  status = 'idle',
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shake, setShake] = useState(false);

  // Trigger shake animation on error
  useEffect(() => {
    if (status !== 'error') return;

    setShake(true);
    const timer = setTimeout(() => setShake(false), 500);
    return () => clearTimeout(timer);
  }, [status]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Convert value string to array of digits
  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, '').slice(-1);

    if (digit) {
      // Update value
      const newDigits = [...digits];
      newDigits[index] = digit;
      onChange(newDigits.join('').slice(0, length));

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];

      if (digits[index]) {
        // Clear current digit
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      // Focus the next empty input or last input
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Style classes based on status
  const getBoxStyles = (hasValue: boolean) => {
    const baseStyles = 'w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 transition-all duration-200 focus:outline-none';

    if (status === 'success') {
      return `${baseStyles} border-green-500 bg-green-50 text-green-700 focus:border-green-600 focus:ring-2 focus:ring-green-200`;
    }
    if (status === 'error') {
      return `${baseStyles} border-red-500 bg-red-50 text-red-700 focus:border-red-600 focus:ring-2 focus:ring-red-200`;
    }
    // idle state
    return `${baseStyles} ${hasValue ? 'border-primary bg-primary/5 text-gray-900' : 'border-gray-300 bg-white text-gray-900'} focus:border-primary focus:ring-2 focus:ring-primary/20`;
  };

  return (
    <div
      className={`flex gap-2 justify-center ${shake ? 'animate-shake' : ''}`}
      style={shake ? { animation: 'shake 0.5s ease-in-out' } : undefined}
    >
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={getBoxStyles(!!digit)}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

interface SecurityTabProps {
  isPhoneVerified: boolean;
  currentPhone: string | null;
  canChangePassword: boolean;
  onPhoneVerified: () => void;
}

export function SecurityTab({
  isPhoneVerified,
  currentPhone,
  canChangePassword,
  onPhoneVerified,
}: SecurityTabProps) {
  const phoneVerification = usePhoneVerification({ onSuccess: onPhoneVerified });
  const passwordChange = useChangePassword();
  const accountDeletion = useAccountDeletion(() => {
    // Sign out after successful deletion
    setTimeout(() => signOut({ callbackUrl: '/' }), 3000);
  });

  // Format phone number for display (mask middle digits)
  const formatPhoneDisplay = (phone: string | null) => {
    if (!phone) return '';
    if (phone.length < 10) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
  };

  return (
    <div className="space-y-6">
      {/* Phone Verification Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Phone Verification</h3>
          <p className="text-sm text-gray-500">Verify your phone number to post ads and contact sellers</p>
        </div>

        {phoneVerification.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {phoneVerification.success}
          </div>
        )}

        {isPhoneVerified ? (
          <PhoneVerifiedSection
            phone={currentPhone}
            formatPhoneDisplay={formatPhoneDisplay}
            phoneVerification={phoneVerification}
          />
        ) : (
          <PhoneNotVerifiedSection phoneVerification={phoneVerification} />
        )}
      </div>

      {/* Change Password Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
          <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
        </div>

        {canChangePassword ? (
          <ChangePasswordForm passwordChange={passwordChange} />
        ) : (
          <OAuthOnlyMessage />
        )}
      </div>

      {/* Security Tips */}
      <SecurityTips />

      {/* Danger Zone - Account Deletion */}
      {isPhoneVerified && (
        <DangerZone accountDeletion={accountDeletion} />
      )}
    </div>
  );
}

// Sub-components
function PhoneVerifiedSection({
  phone,
  formatPhoneDisplay,
  phoneVerification,
}: {
  phone: string | null;
  formatPhoneDisplay: (phone: string | null) => string;
  phoneVerification: ReturnType<typeof usePhoneVerification>;
}) {
  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{formatPhoneDisplay(phone)}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </p>
          </div>
        </div>
        <button
          onClick={phoneVerification.startVerification}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Change
        </button>
      </div>

      {phoneVerification.step !== 'idle' && (
        <PhoneVerificationForm phoneVerification={phoneVerification} />
      )}
    </div>
  );
}

function PhoneNotVerifiedSection({
  phoneVerification,
}: {
  phoneVerification: ReturnType<typeof usePhoneVerification>;
}) {
  return (
    <div className="max-w-md">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Phone not verified</p>
            <p className="text-xs text-amber-700 mt-0.5">Verify your phone to post ads and contact sellers securely.</p>
          </div>
        </div>
      </div>

      {phoneVerification.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {phoneVerification.error}
        </div>
      )}

      <PhoneVerificationForm phoneVerification={phoneVerification} showInitialForm />
    </div>
  );
}

function PhoneVerificationForm({
  phoneVerification,
  showInitialForm = false,
}: {
  phoneVerification: ReturnType<typeof usePhoneVerification>;
  showInitialForm?: boolean;
}) {
  const showEnterPhone = showInitialForm
    ? phoneVerification.step === 'idle' || phoneVerification.step === 'enter_phone'
    : phoneVerification.step === 'enter_phone';

  if (showEnterPhone) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          {!showInitialForm && (
            <p className="text-sm text-gray-600">Enter your new phone number to verify:</p>
          )}
          {phoneVerification.error && !showInitialForm && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {phoneVerification.error}
            </div>
          )}
          <div>
            {showInitialForm && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
            )}
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneVerification.phoneToVerify}
                onChange={(e) => phoneVerification.setPhoneToVerify(e.target.value.replace(/\D/g, ''))}
                placeholder="98XXXXXXXX"
                maxLength={10}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={phoneVerification.sendOtp}
                disabled={phoneVerification.isSendingOtp || phoneVerification.phoneToVerify.length < 10 || phoneVerification.cooldown > 0}
                className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {phoneVerification.isSendingOtp ? 'Sending...' : phoneVerification.cooldown > 0 ? `Wait ${phoneVerification.cooldown}s` : 'Send OTP'}
              </button>
            </div>
            {showInitialForm && (
              <p className="text-xs text-gray-500 mt-1.5">Enter your 10-digit Nepali phone number (starting with 97 or 98)</p>
            )}
          </div>
          {!showInitialForm && (
            <button
              onClick={phoneVerification.cancelVerification}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phoneVerification.step === 'enter_otp') {
    // Determine OTP input status
    const otpStatus = phoneVerification.success ? 'success' : phoneVerification.error ? 'error' : 'idle';

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter OTP sent to {phoneVerification.phoneToVerify}
            </label>

            {/* OTP Input with individual boxes */}
            <OtpInput
              value={phoneVerification.otp}
              onChange={phoneVerification.setOtp}
              status={otpStatus}
              disabled={phoneVerification.isVerifying}
            />

            {/* Error message below OTP */}
            {phoneVerification.error && (
              <div className="mt-3 text-center text-sm text-red-600 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {phoneVerification.error}
              </div>
            )}

            {/* Success message */}
            {phoneVerification.success && (
              <div className="mt-3 text-center text-sm text-green-600 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {phoneVerification.success}
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={phoneVerification.verifyOtp}
              disabled={phoneVerification.isVerifying || phoneVerification.otp.length !== 6}
              className="w-full mt-4 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phoneVerification.isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={phoneVerification.changeNumber}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Change number
            </button>
            <button
              onClick={phoneVerification.sendOtp}
              disabled={phoneVerification.isSendingOtp || phoneVerification.cooldown > 0}
              className="text-sm text-primary hover:text-primary-hover disabled:text-gray-400"
            >
              {phoneVerification.cooldown > 0 ? `Resend in ${phoneVerification.cooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ChangePasswordForm({
  passwordChange,
}: {
  passwordChange: ReturnType<typeof useChangePassword>;
}) {
  return (
    <form onSubmit={passwordChange.changePassword} className="space-y-5 max-w-md">
      {passwordChange.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {passwordChange.error}
        </div>
      )}

      {passwordChange.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {passwordChange.success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Password
        </label>
        <input
          type="password"
          value={passwordChange.passwordData.currentPassword}
          onChange={(e) => passwordChange.setCurrentPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="Enter your current password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <input
          type="password"
          value={passwordChange.passwordData.newPassword}
          onChange={(e) => passwordChange.setNewPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="Enter new password (min 8 characters)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <input
          type="password"
          value={passwordChange.passwordData.confirmPassword}
          onChange={(e) => passwordChange.setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="Confirm new password"
        />
      </div>

      <button
        type="submit"
        disabled={passwordChange.isChanging || !passwordChange.isValid}
        className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {passwordChange.isChanging ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Changing...
          </>
        ) : (
          'Change Password'
        )}
      </button>
    </form>
  );
}

function OAuthOnlyMessage() {
  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center max-w-md">
      <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>
      <h4 className="text-base font-semibold text-gray-900 mb-2">Password Not Available</h4>
      <p className="text-sm text-gray-600">
        You signed in with Google. Password change is not available for social login accounts.
      </p>
    </div>
  );
}

function SecurityTips() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Security Tips
      </h4>
      <ul className="text-sm text-blue-700 space-y-1">
        <li>• Use a strong password with at least 8 characters</li>
        <li>• Include uppercase, lowercase, numbers, and special characters</li>
        <li>• Never share your password with anyone</li>
        <li>• Don&apos;t use the same password on multiple sites</li>
        <li>• Keep your verified phone number up to date</li>
      </ul>
    </div>
  );
}

// Danger Zone Component
function DangerZone({
  accountDeletion,
}: {
  accountDeletion: ReturnType<typeof useAccountDeletion>;
}) {
  const { step, error, otp, cooldown, maskedPhone, recoveryDeadline, isProcessing } = accountDeletion;

  // Format recovery deadline for display
  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Success state
  if (step === 'success') {
    return (
      <div className="border-t border-red-200 pt-6 mt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Scheduled for Deletion</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your account will be permanently deleted on <strong>{formatDeadline(recoveryDeadline)}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            If you change your mind, simply log in again before this date to reactivate your account.
          </p>
          <p className="text-xs text-gray-400 mt-4">You will be signed out in a few seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-red-200 pt-6 mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-red-600 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h3>
        <p className="text-sm text-gray-500">Irreversible and destructive actions</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        {step === 'idle' && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Delete Account</h4>
              <p className="text-xs text-gray-600">
                Once you delete your account, all your data will be hidden from other users.
                You have 30 days to recover your account by logging in again. After 30 days,
                your account and all data will be permanently deleted.
              </p>
            </div>
            <button
              onClick={accountDeletion.startDeletion}
              className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}

        {step === 'confirm_intent' && (
          <div className="space-y-4">
            <div className="bg-white border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Are you sure you want to delete your account?
              </h4>
              <p className="text-xs text-gray-600 mb-3">This will:</p>
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                <li>• Hide your profile from other users immediately</li>
                <li>• Deactivate all your active ads</li>
                <li>• Give you 30 days to recover by logging in again</li>
                <li>• Permanently delete all your data after 30 days</li>
              </ul>
              <p className="text-xs text-gray-500">
                We will send a verification code to your registered phone number.
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={accountDeletion.cancel}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={accountDeletion.confirmIntent}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  'Yes, Send Verification Code'
                )}
              </button>
            </div>
          </div>
        )}

        {(step === 'sending_otp' || step === 'enter_otp' || step === 'deleting') && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-1">
                Enter the verification code sent to
              </p>
              <p className="text-sm font-medium text-gray-900">{maskedPhone}</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <OtpInput
              value={otp}
              onChange={accountDeletion.setOtp}
              status={error ? 'error' : 'idle'}
              disabled={step === 'deleting'}
              autoFocus
            />

            <button
              onClick={accountDeletion.verifyOtp}
              disabled={otp.length !== 6 || step === 'deleting'}
              className="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 'deleting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting Account...
                </>
              ) : (
                'Confirm Account Deletion'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={accountDeletion.cancel}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={accountDeletion.resendOtp}
                disabled={cooldown > 0 || isProcessing}
                className="text-red-600 hover:text-red-700 disabled:text-gray-400"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
