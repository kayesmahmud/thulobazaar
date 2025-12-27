export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxAdsPerUser: number;
  adExpiryDays: number;
  freeAdsLimit: number;
  maxImagesPerAd: number;
  // SMTP Settings
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string;
  // SMS Settings
  smsEnabled: boolean;
  // Notification Preferences
  notifyOnVerificationApproved: boolean;
  notifyOnVerificationRejected: boolean;
  notifyOnAccountSuspended: boolean;
  notifyOnAdApproved: boolean;
  notifyOnAdRejected: boolean;
  // SMS Message Templates
  smsBusinessApproved: string;
  smsBusinessRejected: string;
  smsIndividualApproved: string;
  smsIndividualRejected: string;
  smsAccountSuspended: string;
  smsAccountUnsuspended: string;
  smsAdApproved: string;
  smsAdRejected: string;
  // Custom Broadcast Messages
  smsBroadcastAll: string;
  smsBroadcastRegular: string;
  smsBroadcastBusiness: string;
  smsBroadcastIndividual: string;
}

export type SettingsTab = 'general' | 'ads' | 'users' | 'email' | 'sms';

export const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'ThuluBazaar',
  siteDescription: "Nepal's Leading Marketplace",
  contactEmail: 'support@thulobazaar.com',
  supportPhone: '+977-1-1234567',
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: true,
  maxAdsPerUser: 50,
  adExpiryDays: 30,
  freeAdsLimit: 5,
  maxImagesPerAd: 10,
  // SMTP
  smtpEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smtpFromEmail: 'noreply@thulobazaar.com',
  smtpFromName: 'Thulo Bazaar',
  // SMS
  smsEnabled: true,
  // Notifications
  notifyOnVerificationApproved: true,
  notifyOnVerificationRejected: true,
  notifyOnAccountSuspended: true,
  notifyOnAdApproved: false,
  notifyOnAdRejected: true,
  // SMS Templates
  smsBusinessApproved:
    'Congratulations {name}! Your business verification on Thulo Bazaar has been approved. You can now enjoy all business seller benefits.',
  smsBusinessRejected:
    'Dear {name}, your business verification on Thulo Bazaar was not approved. Reason: {reason}. Please submit a new request with correct documents.',
  smsIndividualApproved:
    'Congratulations {name}! Your identity verification on Thulo Bazaar has been approved.',
  smsIndividualRejected:
    'Dear {name}, your identity verification on Thulo Bazaar was not approved. Reason: {reason}.',
  smsAccountSuspended:
    'Dear {name}, your Thulo Bazaar account has been suspended. Reason: {reason}. Contact support for assistance.',
  smsAccountUnsuspended:
    'Good news {name}! Your Thulo Bazaar account has been restored. You can now access all features.',
  smsAdApproved: 'Great news {name}! Your ad on Thulo Bazaar has been approved and is now live.',
  smsAdRejected: 'Dear {name}, your ad on Thulo Bazaar was not approved. Reason: {reason}.',
  // Broadcast Templates
  smsBroadcastAll:
    'Dear {name}, this is an important announcement from Thulo Bazaar. {message}',
  smsBroadcastRegular:
    'Dear {name}, get verified on Thulo Bazaar to unlock more features! {message}',
  smsBroadcastBusiness: 'Dear Business Partner {name}, {message} - Thulo Bazaar',
  smsBroadcastIndividual: 'Dear Verified Seller {name}, {message} - Thulo Bazaar',
};

export const SETTINGS_TABS = [
  { id: 'general' as const, label: 'General', icon: '⚙️' },
  { id: 'ads' as const, label: 'Ad Settings', icon: '📢' },
  { id: 'users' as const, label: 'User Settings', icon: '👥' },
  { id: 'email' as const, label: 'Email', icon: '📧' },
  { id: 'sms' as const, label: 'SMS (Aakash)', icon: '📱' },
];
