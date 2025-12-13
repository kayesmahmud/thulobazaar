export interface AdBadgesProps {
  condition: string | null;
  isNegotiable: boolean;
  fullCategory: string;
  isFeatured: boolean;
  featuredUntil: Date | null;
  isUrgent: boolean;
  urgentUntil: Date | null;
  isSticky: boolean;
  stickyUntil: Date | null;
}

export interface SpecificationsSectionProps {
  customFields: Record<string, any> | null;
}

export interface LocationSectionProps {
  fullLocation: string;
  locationType: string | null;
}

export interface SellerUser {
  id: number;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  business_phone: string | null;
  avatar: string | null;
  shop_slug: string | null;
  account_type: string | null;
  business_name: string | null;
  individual_verified: boolean | null;
  business_verification_status: string | null;
  created_at: Date | null;
}

export interface SellerCardProps {
  seller: SellerUser | null;
  adId: number;
  userId: number | null;
  adTitle: string;
  adSlug: string;
  lang: string;
}
