export interface PromotionPricing {
  id: number;
  promotion_type: string;
  duration_days: number;
  account_type: string;
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
  price: 0,
  discount_percentage: 0,
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
