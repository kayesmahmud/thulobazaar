export interface CategoryTierMapping {
  id: number;
  categoryId: number | null;
  categoryName: string;
  pricingTier: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export const PRICING_TIERS = ['default', 'electronics', 'vehicles', 'property'] as const;
export type PricingTier = typeof PRICING_TIERS[number];

export const pricingTierLabels: Record<string, string> = {
  default: 'Default (Base Price)',
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

export const pricingTierDescriptions: Record<string, string> = {
  default: 'Standard pricing for all other categories',
  electronics: 'Higher pricing (~1.5x) for electronics and mobile devices',
  vehicles: 'Premium pricing (~2x) for vehicles',
  property: 'Premium pricing (~2.5x) for property/real estate',
};
