'use client';

import {
  useRegisterForm,
  SocialLoginButtons,
  PhoneRegistrationFlow,
} from './components';

interface RegisterFormProps {
  lang: string;
}

export default function RegisterForm({ lang }: RegisterFormProps) {
  const {
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
    error,
    success,
    isLoading,
    socialLoading,
    sessionStatus,
    handleSendOtp,
    handleVerifyOtp,
    handlePhoneSubmit,
    handleSocialLogin,
    formatTime,
    clearMessages,
  } = useRegisterForm(lang);

  // Loading state while checking session
  if (sessionStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-gray-500 text-sm">Checking session...</span>
      </div>
    );
  }

  // Already authenticated
  if (sessionStatus === 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">You&apos;re already logged in!</h3>
        <p className="text-gray-500 text-sm mb-4">Redirecting you to the homepage...</p>
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Social Login Buttons */}
      <SocialLoginButtons
        isLoading={isLoading}
        socialLoading={socialLoading}
        onSocialLogin={handleSocialLogin}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or register with phone</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-500 text-red-600 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-500 text-green-600 px-4 py-3 rounded-lg">
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Phone Registration Flow */}
      <PhoneRegistrationFlow
        phoneStep={phoneStep}
        setPhoneStep={setPhoneStep}
        phone={phone}
        setPhone={setPhone}
        otp={otp}
        setOtp={setOtp}
        otpCooldown={otpCooldown}
        otpExpiry={otpExpiry}
        formData={formData}
        setFormData={setFormData}
        isLoading={isLoading}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        onSubmit={handlePhoneSubmit}
        formatTime={formatTime}
        clearMessages={clearMessages}
      />
    </div>
  );
}
