export interface AdBadgesProps {
  lastEditedAt?: Date | string | null;
  /** Category → subcategory links, parent first (each goes to that category's listing). */
  categoryLinks?: Array<{ name: string; href: string }>;
  condition: string | null;
  isNegotiable: boolean;
  isCodAvailable: boolean;
  /** Slug of the ad's own category — a subcategory for almost every ad. */
  categorySlug: string | null;
  /** Parent category slug, null when the ad sits directly on a parent. */
  parentCategorySlug: string | null;
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
  lang?: string;
  /** The ad's own category name — a subcategory for almost every ad. */
  categoryName: string | null;
  /** Parent category name, null when the ad sits directly on a parent. */
  parentCategoryName: string | null;
}

export interface LocationSectionProps {
  fullLocation: string;
  /** Location chain links, leaf → root (each goes to that location's listing). */
  locationLinks?: Array<{ name: string; href: string }>;
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
  favoritesCount?: number;
  /** Per-ad WhatsApp number (from custom_fields) when the seller set a custom one. */
  whatsappNumber?: string | null;
}
