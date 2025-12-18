export interface VerificationPricing {
  id: number;
  verificationType: string;
  durationDays: number;
  price: number;
  discountPercentage: number;
  isActive: boolean;
}

export interface EditForm {
  price: number;
  isActive: boolean;
}

export const DURATION_LABELS: Record<number, string> = {
  30: '1 Month',
  90: '3 Months',
  180: '6 Months',
  365: '1 Year',
};

export const DEFAULT_EDIT_FORM: EditForm = {
  price: 0,
  isActive: true,
};

export const groupPricingsByType = (
  pricings: VerificationPricing[]
): Record<string, VerificationPricing[]> => {
  return pricings.reduce((acc, pricing) => {
    if (!acc[pricing.verificationType]) {
      acc[pricing.verificationType] = [];
    }
    acc[pricing.verificationType]!.push(pricing);
    return acc;
  }, {} as Record<string, VerificationPricing[]>);
};

export const getPricingStats = (pricings: VerificationPricing[]) => ({
  total: pricings.length,
  individual: pricings.filter(p => p.verificationType === 'individual').length,
  business: pricings.filter(p => p.verificationType === 'business').length,
  active: pricings.filter(p => p.isActive).length,
});
