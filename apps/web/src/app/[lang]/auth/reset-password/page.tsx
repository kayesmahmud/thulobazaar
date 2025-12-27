'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResetPassword } from './useResetPassword';
import {
  OtpVerificationStep,
  PasswordResetStep,
  SuccessAlert,
  ErrorAlert,
} from './components';

export default function ResetPasswordPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const searchParams = useSearchParams();

  const method = searchParams.get('method') || 'phone';
  const identifier = searchParams.get('identifier') || '';

  const {
    otp,
    newPassword,
    confirmPassword,
    step,
    isLoading,
    isResending,
    error,
    success,
    cooldown,
    maskedIdentifier,
    inputRefs,
    setNewPassword,
    setConfirmPassword,
    handleOtpChange,
    handleOtpKeyDown,
    handleVerifyOtp,
    handleResetPassword,
    handleResendOtp,
  } = useResetPassword(lang, method, identifier);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href={`/${lang}`} className="flex justify-center">
          <span className="text-3xl font-bold text-primary">ThuLoBazaar</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {step === 'otp' ? 'Enter verification code' : 'Create new password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'otp'
            ? `We sent a 6-digit code to ${maskedIdentifier}`
            : 'Enter your new password below'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10 border border-gray-200">
          <SuccessAlert message={success} />
          <ErrorAlert message={error} />

          {step === 'otp' && (
            <OtpVerificationStep
              otp={otp}
              isLoading={isLoading}
              isResending={isResending}
              cooldown={cooldown}
              inputRefs={inputRefs}
              onOtpChange={handleOtpChange}
              onOtpKeyDown={handleOtpKeyDown}
              onSubmit={handleVerifyOtp}
              onResendOtp={handleResendOtp}
            />
          )}

          {step === 'password' && (
            <PasswordResetStep
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              isLoading={isLoading}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onSubmit={handleResetPassword}
            />
          )}

          <div className="mt-6 text-center">
            <Link href={`/${lang}/auth/signin`} className="text-sm text-gray-600 hover:text-primary">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
