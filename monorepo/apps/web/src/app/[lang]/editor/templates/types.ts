export interface Template {
  id: number;
  title: string;
  category: string;
  content: string;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export type CategoryType = 'all' | 'ad_rejection' | 'verification_rejection' | 'support' | 'suspension';

export interface CategoryConfig {
  value: string;
  label: string;
  icon: string;
}

export interface TemplateFormData {
  title: string;
  category: string;
  content: string;
}

export const DEFAULT_FORM_DATA: TemplateFormData = {
  title: '',
  category: 'ad_rejection',
  content: '',
};

export const CATEGORIES: CategoryConfig[] = [
  { value: 'all', label: 'All Templates', icon: '📋' },
  { value: 'ad_rejection', label: 'Ad Rejections', icon: '🚫' },
  { value: 'verification_rejection', label: 'Verification Rejections', icon: '❌' },
  { value: 'support', label: 'Support Responses', icon: '💬' },
  { value: 'suspension', label: 'Account Suspensions', icon: '⚠️' },
];

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 1,
    title: 'Inappropriate Content',
    category: 'ad_rejection',
    content: 'Your ad has been rejected because it contains inappropriate content that violates our community guidelines. Please review our policies and resubmit with appropriate content.',
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    usageCount: 45,
  },
  {
    id: 2,
    title: 'Duplicate Listing',
    category: 'ad_rejection',
    content: 'This ad appears to be a duplicate of an existing listing. Please remove duplicate posts to maintain quality on our platform.',
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    usageCount: 32,
  },
  {
    id: 3,
    title: 'Incomplete Business Documents',
    category: 'verification_rejection',
    content: 'Your business verification has been rejected due to incomplete or unclear documentation. Please provide clear photos of your business license and registration documents.',
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    usageCount: 28,
  },
  {
    id: 4,
    title: 'Welcome Support Message',
    category: 'support',
    content: "Hello! Thank you for contacting ThuLoBazaar support. We're here to help you. Please describe your issue in detail and we'll get back to you as soon as possible.",
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    usageCount: 156,
  },
  {
    id: 5,
    title: 'Spam Activity Warning',
    category: 'suspension',
    content: 'Your account has been temporarily suspended due to spam-like activity. This includes posting multiple similar ads or excessive messaging. Please review our terms of service.',
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    usageCount: 12,
  },
];

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ad_rejection: 'Ad Rejection',
    verification_rejection: 'Verification Rejection',
    support: 'Support',
    suspension: 'Suspension',
  };
  return labels[category] || category;
}

export function getCategoryBadge(category: string): string {
  const badges: Record<string, string> = {
    ad_rejection: 'bg-red-100 text-red-800 border-red-200',
    verification_rejection: 'bg-orange-100 text-orange-800 border-orange-200',
    support: 'bg-blue-100 text-blue-800 border-blue-200',
    suspension: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };
  return badges[category] || 'bg-gray-100 text-gray-800 border-gray-200';
}
