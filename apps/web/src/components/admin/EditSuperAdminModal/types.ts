export interface SuperAdmin {
  id: number;
  full_name: string;
  email: string;
  two_factor_enabled?: boolean;
}

export interface EditSuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  superAdmin: SuperAdmin | null;
}

export interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TwoFactorState {
  show2FASetup: boolean;
  qrCode: string;
  secret: string;
  verificationCode: string;
  backupCodes: string[];
  showBackupCodes: boolean;
  twoFactorLoading: boolean;
  twoFactorEnabled: boolean;
}
