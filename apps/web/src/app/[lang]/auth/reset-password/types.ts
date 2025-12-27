export type ResetStep = 'otp' | 'password';

export interface UseResetPasswordReturn {
  // State
  otp: string[];
  newPassword: string;
  confirmPassword: string;
  step: ResetStep;
  isLoading: boolean;
  isResending: boolean;
  error: string;
  success: string;
  cooldown: number;
  maskedIdentifier: string;

  // Refs
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;

  // Setters
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;

  // Handlers
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  handleVerifyOtp: (e: React.FormEvent) => Promise<void>;
  handleResetPassword: (e: React.FormEvent) => Promise<void>;
  handleResendOtp: () => Promise<void>;
}

export function maskIdentifier(method: string, identifier: string): string {
  return method === 'phone'
    ? `+977 ${identifier.slice(0, 2)}****${identifier.slice(-2)}`
    : identifier.replace(/(.{2})(.*)(@.*)/, '$1***$3');
}
