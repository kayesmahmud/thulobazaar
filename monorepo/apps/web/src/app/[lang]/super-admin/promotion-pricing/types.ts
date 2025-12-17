export interface PromotionPricing {
  id: number;
  promotion_type: string;
  duration_days: number;
  account_type: string;
  pricing_tier: string;
  price: number;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EditFormData {
  price: number;
  discount_percentage: number;
  is_active: boolean;
}

export interface AddFormData {
  promotion_type: string;
  duration_days: number;
  account_type: string;
  pricing_tier: string;
  price: number;
  discount_percentage: number;
}

export const DEFAULT_EDIT_FORM: EditFormData = {
  price: 0,
  discount_percentage: 0,
  is_active: true,
};

export const DEFAULT_ADD_FORM: AddFormData = {
  promotion_type: 'featured',
  duration_days: 3,
  account_type: 'individual',
  pricing_tier: 'default',
  price: 0,
  discount_percentage: 0,
};

export const PRICING_TIERS = ['default', 'electronics', 'vehicles', 'property'] as const;
export type PricingTier = typeof PRICING_TIERS[number];

export const pricingTierLabels: Record<string, string> = {
  default: 'Default (All Others)',
  electronics: 'Electronics & Mobiles',
  vehicles: 'Vehicles',
  property: 'Property',
};

export const pricingTierColors: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800',
  electronics: 'bg-blue-100 text-blue-800',
  vehicles: 'bg-green-100 text-green-800',
  property: 'bg-purple-100 text-purple-800',
};

export const promotionTypeLabels: Record<string, string> = {
  featured: 'Featured',
  urgent: 'Urgent',
  sticky: 'Sticky',
};

export const promotionTypeColors: Record<string, string> = {
  featured: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800',
  sticky: 'bg-blue-100 text-blue-800',
};

export const accountTypeLabels: Record<string, string> = {
  individual: 'Individual',
  individual_verified: 'Individual Verified',
  business: 'Business',
};
