import { prisma } from '@thulobazaar/database';

const VERIFIED_BUSINESS_STATUSES = ['approved', 'verified'];

const SHOP_SELECT = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  avatar: true,
  cover_photo: true,
  bio: true,
  account_type: true,
  shop_slug: true,
  custom_shop_slug: true,
  seller_slug: true,
  business_name: true,
  business_category: true,
  business_description: true,
  business_website: true,
  business_phone: true,
  business_address: true,
  google_maps_link: true,
  business_verification_status: true,
  individual_verified: true,
  created_at: true,
  locations: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

interface RawShopRow {
  id: number;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar: string | null;
  cover_photo: string | null;
  bio: string | null;
  account_type: string | null;
  shop_slug: string | null;
  custom_shop_slug: string | null;
  seller_slug: string | null;
  business_name: string | null;
  business_category: string | null;
  business_description: string | null;
  business_website: string | null;
  business_phone: string | null;
  business_address: string | null;
  google_maps_link: string | null;
  business_verification_status: string | null;
  individual_verified: boolean | null;
  created_at: Date | null;
  locations: {
    id: number;
    name: string;
    slug: string | null;
  } | null;
}

export interface ShopProfile {
  id: number;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  bio: string | null;
  accountType: string | null;
  shopSlug: string | null;
  customShopSlug: string | null;
  sellerSlug: string | null;
  businessName: string | null;
  businessCategory: string | null;
  businessDescription: string | null;
  businessWebsite: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  googleMapsLink: string | null;
  businessVerificationStatus: string | null;
  individualVerified: boolean;
  createdAt: Date | null;
  location: {
    id: number;
    name: string;
    slug: string | null;
  } | null;
}

const transformShop = (shop: RawShopRow): ShopProfile => ({
  id: shop.id,
  email: shop.email,
  fullName: shop.full_name || '',
  phone: shop.phone,
  avatar: shop.avatar,
  coverPhoto: shop.cover_photo,
  bio: shop.bio,
  accountType: shop.account_type,
  shopSlug: shop.shop_slug,
  customShopSlug: shop.custom_shop_slug,
  sellerSlug: shop.seller_slug,
  businessName: shop.business_name,
  businessCategory: shop.business_category,
  businessDescription: shop.business_description,
  businessWebsite: shop.business_website,
  businessPhone: shop.business_phone,
  businessAddress: shop.business_address,
  googleMapsLink: shop.google_maps_link,
  businessVerificationStatus: shop.business_verification_status,
  individualVerified: shop.individual_verified || false,
  createdAt: shop.created_at,
  location: shop.locations
    ? {
        id: shop.locations.id,
        name: shop.locations.name,
        slug: shop.locations.slug,
      }
    : null,
});

const parseUserIdFromSlug = (slug: string): number | null => {
  const parts = slug.split('-');
  const maybeId = parts[parts.length - 1];
  const parsed = Number(maybeId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export async function getShopProfile(shopSlug: string): Promise<ShopProfile | null> {
  // Everyone gets a shop page - no restrictions on verification status
  // Badges are visual only (gold for verified business, blue for verified individual)
  const shopBySlug = await prisma.users.findFirst({
    where: {
      OR: [
        { shop_slug: shopSlug },
        { custom_shop_slug: shopSlug },
        { seller_slug: shopSlug },
      ],
    },
    select: SHOP_SELECT,
  });

  if (shopBySlug) {
    return transformShop(shopBySlug);
  }

  // Fallback: try to parse user ID from slug (e.g., "shop-name-123")
  const userId = parseUserIdFromSlug(shopSlug);

  if (!userId) {
    return null;
  }

  const shopById = await prisma.users.findFirst({
    where: { id: userId },
    select: SHOP_SELECT,
  });

  return shopById ? transformShop(shopById) : null;
}

export function buildShopMetadata(shop: ShopProfile) {
  const displayName = shop.businessName || shop.fullName;
  const description =
    shop.businessDescription || shop.bio || `Shop profile for ${displayName}. Browse products and contact the seller.`;

  return {
    title: `${displayName} - Shop | Thulobazaar`,
    description: description.substring(0, 160),
  };
}
