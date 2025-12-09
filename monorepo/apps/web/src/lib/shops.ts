import { prisma } from '@thulobazaar/database';
import { getLocationBreadcrumb } from '@/lib/locationHierarchy';

const VERIFIED_BUSINESS_STATUSES = ['approved', 'verified'];

const SHOP_SELECT = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  phone_verified: true,
  avatar: true,
  cover_photo: true,
  bio: true,
  account_type: true,
  shop_slug: true,
  custom_shop_slug: true,
  business_name: true,
  business_category: true,
  business_description: true,
  business_website: true,
  business_phone: true,
  business_address: true,
  google_maps_link: true,
  business_verification_status: true,
  individual_verified: true,
  is_active: true,
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
  phone_verified: boolean | null;
  avatar: string | null;
  cover_photo: string | null;
  bio: string | null;
  account_type: string | null;
  shop_slug: string | null;
  custom_shop_slug: string | null;
  business_name: string | null;
  business_category: string | null;
  business_description: string | null;
  business_website: string | null;
  business_phone: string | null;
  business_address: string | null;
  google_maps_link: string | null;
  business_verification_status: string | null;
  individual_verified: boolean | null;
  is_active: boolean | null;
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
  phoneVerified: boolean;
  avatar: string | null;
  coverPhoto: string | null;
  bio: string | null;
  accountType: string | null;
  shopSlug: string | null;
  customShopSlug: string | null;
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
  locationFullPath: string | null; // Full hierarchy path like "Thamel, Kathmandu Metropolitan City, Kathmandu, Bagmati Province"
}

const transformShop = async (shop: RawShopRow): Promise<ShopProfile> => {
  // Get full location hierarchy path if location exists
  let locationFullPath: string | null = null;
  if (shop.locations) {
    try {
      const hierarchy = await getLocationBreadcrumb(shop.locations.id);
      // Reverse to show from most specific to most general: "Thamel, Kathmandu Metro, Kathmandu, Bagmati"
      locationFullPath = hierarchy.map(h => h.name).reverse().join(', ');
    } catch (error) {
      console.error('Error fetching location hierarchy:', error);
    }
  }

  return {
    id: shop.id,
    email: shop.email,
    fullName: shop.full_name || '',
    phone: shop.phone,
    phoneVerified: shop.phone_verified || false,
    avatar: shop.avatar,
    coverPhoto: shop.cover_photo,
    bio: shop.bio,
    accountType: shop.account_type,
    shopSlug: shop.shop_slug,
    customShopSlug: shop.custom_shop_slug,
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
    locationFullPath,
  };
};

const parseUserIdFromSlug = (slug: string): number | null => {
  const parts = slug.split('-');
  const maybeId = parts[parts.length - 1];
  const parsed = Number(maybeId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export async function getShopProfile(shopSlug: string): Promise<ShopProfile | null> {
  // Everyone gets a shop page - no restrictions on verification status
  // Badges are visual only (gold for verified business, blue for verified individual)
  // Filter out suspended/inactive shops (is_active: false)
  const shopBySlug = await prisma.users.findFirst({
    where: {
      is_active: true, // Only show active shops
      OR: [
        { shop_slug: shopSlug },
        { custom_shop_slug: shopSlug },
      ],
    },
    select: SHOP_SELECT,
  });

  if (shopBySlug) {
    return await transformShop(shopBySlug);
  }

  // Fallback: try to parse user ID from slug (e.g., "shop-name-123")
  const userId = parseUserIdFromSlug(shopSlug);

  if (!userId) {
    return null;
  }

  const shopById = await prisma.users.findFirst({
    where: {
      id: userId,
      is_active: true, // Only show active shops
    },
    select: SHOP_SELECT,
  });

  return shopById ? await transformShop(shopById) : null;
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
