export type RegistrationType = 'email' | 'phone';
export type PhoneStep = 'phone' | 'otp' | 'details';

export interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface UseRegisterFormReturn {
  // Registration type
  registrationType: RegistrationType;
  setRegistrationType: (type: RegistrationType) => void;

  // Phone registration state
  phoneStep: PhoneStep;
  setPhoneStep: (step: PhoneStep) => void;
  phone: string;
  setPhone: (phone: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  otpCooldown: number;
  otpExpiry: number;

  // Form data
  formData: FormData;
  setFormData: (data: FormData) => void;

  // Status
  error: string;
  setError: (error: string) => void;
  success: string;
  setSuccess: (success: string) => void;
  isLoading: boolean;
  socialLoading: string | null;

  // Session
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';

  // Handlers
  handleSendOtp: () => Promise<void>;
  handleVerifyOtp: () => Promise<void>;
  handleEmailSubmit: (e: React.FormEvent) => Promise<void>;
  handlePhoneSubmit: (e: React.FormEvent) => Promise<void>;
  handleSocialLogin: (provider: 'google' | 'facebook') => Promise<void>;
  formatTime: (seconds: number) => string;
  clearMessages: () => void;
}
