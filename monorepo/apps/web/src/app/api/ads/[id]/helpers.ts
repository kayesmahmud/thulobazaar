import { NextResponse } from 'next/server';
import type { Prisma } from '@thulobazaar/database';

// Prisma ad with relations type
export type AdWithRelations = Prisma.adsGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    price: true;
    condition: true;
    status: true;
    slug: true;
    seller_name: true;
    seller_phone: true;
    view_count: true;
    custom_fields: true;
    is_featured: true;
    is_urgent: true;
    is_sticky: true;
    featured_until: true;
    urgent_until: true;
    sticky_until: true;
    latitude: true;
    longitude: true;
    created_at: true;
    updated_at: true;
    categories: {
      select: {
        id: true;
        name: true;
        slug: true;
        icon: true;
        form_template: true;
        parent_id: true;
      };
    };
    locations: {
      select: {
        id: true;
        name: true;
        type: true;
        slug: true;
        parent_id: true;
      };
    };
    users_ads_user_idTousers: {
      select: {
        id: true;
        full_name: true;
        phone: true;
        avatar: true;
        bio: true;
        shop_slug: true;
        individual_verified: true;
        business_name: true;
        business_verification_status: true;
        created_at: true;
      };
    };
    ad_images: {
      select: {
        id: true;
        filename: true;
        file_path: true;
        original_name: true;
        file_size: true;
        mime_type: true;
        is_primary: true;
        created_at: true;
      };
    };
  };
}>;

export interface LocationBreadcrumb {
  id: number;
  name: string;
  type: string;
  slug?: string;
}

// Transform ad from DB to API response
export function transformAdToResponse(ad: AdWithRelations, locationHierarchy: LocationBreadcrumb[]) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price ? parseFloat(ad.price.toString()) : null,
    condition: ad.condition,
    status: ad.status,
    slug: ad.slug,
    sellerName: ad.seller_name,
    sellerPhone: ad.seller_phone,
    viewCount: ad.view_count,
    customFields: ad.custom_fields || {},
    isFeatured: ad.is_featured,
    isUrgent: ad.is_urgent,
    isSticky: ad.is_sticky,
    featuredUntil: ad.featured_until,
    urgentUntil: ad.urgent_until,
    stickyUntil: ad.sticky_until,
    latitude: ad.latitude ? parseFloat(ad.latitude.toString()) : null,
    longitude: ad.longitude ? parseFloat(ad.longitude.toString()) : null,
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    category: ad.categories
      ? {
          id: ad.categories.id,
          name: ad.categories.name,
          slug: ad.categories.slug,
          icon: ad.categories.icon,
          formTemplate: ad.categories.form_template,
          parentId: ad.categories.parent_id,
        }
      : null,
    location: ad.locations
      ? {
          id: ad.locations.id,
          name: ad.locations.name,
          type: ad.locations.type,
          slug: ad.locations.slug,
          parentId: ad.locations.parent_id,
        }
      : null,
    locationHierarchy,
    user: ad.users_ads_user_idTousers
      ? {
          id: ad.users_ads_user_idTousers.id,
          fullName: ad.users_ads_user_idTousers.full_name,
          phone: ad.users_ads_user_idTousers.phone,
          avatar: ad.users_ads_user_idTousers.avatar,
          bio: ad.users_ads_user_idTousers.bio,
          shopSlug: ad.users_ads_user_idTousers.shop_slug,
          individualVerified: ad.users_ads_user_idTousers.individual_verified,
          businessName: ad.users_ads_user_idTousers.business_name,
          businessVerificationStatus: ad.users_ads_user_idTousers.business_verification_status,
          memberSince: ad.users_ads_user_idTousers.created_at,
        }
      : null,
    images: ad.ad_images.map((img) => ({
      id: img.id,
      filename: img.filename,
      filePath: img.file_path,
      originalName: img.original_name,
      fileSize: img.file_size,
      mimeType: img.mime_type,
      isPrimary: img.is_primary,
      createdAt: img.created_at,
    })),
  };
}

// Normalize condition values
export function normalizeCondition(condition: string | undefined): string | undefined {
  if (!condition) return undefined;

  const conditionLower = condition.toLowerCase();
  if (conditionLower === 'brand new' || conditionLower === 'new') {
    return 'new';
  } else if (conditionLower === 'used' || conditionLower === 'reconditioned') {
    return 'used';
  }
  return condition;
}

// Parse JSON safely - returns null on parse error when defaultValue is null
export function parseJsonSafe<T>(str: string | undefined, defaultValue: T): T {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str) as T;
  } catch (err) {
    console.debug('JSON parse failed, using default:', err);
    return defaultValue;
  }
}

// Parse JSON with validation - returns undefined on error for conditional checks
export function tryParseJson<T>(str: string | undefined): T | undefined {
  if (!str) return undefined;
  try {
    return JSON.parse(str) as T;
  } catch (err) {
    console.debug('JSON parse failed:', err);
    return undefined;
  }
}

// Error response helpers
export function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function messageResponse(message: string, status = 200) {
  return NextResponse.json({ success: true, message }, { status });
}

// Ad select query for GET
export const adSelectQuery = {
  id: true,
  title: true,
  description: true,
  price: true,
  condition: true,
  status: true,
  slug: true,
  seller_name: true,
  seller_phone: true,
  view_count: true,
  custom_fields: true,
  is_featured: true,
  is_urgent: true,
  is_sticky: true,
  featured_until: true,
  urgent_until: true,
  sticky_until: true,
  latitude: true,
  longitude: true,
  created_at: true,
  updated_at: true,
  categories: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      form_template: true,
      parent_id: true,
    },
  },
  locations: {
    select: {
      id: true,
      name: true,
      type: true,
      slug: true,
      parent_id: true,
    },
  },
  users_ads_user_idTousers: {
    select: {
      id: true,
      full_name: true,
      phone: true,
      avatar: true,
      bio: true,
      shop_slug: true,
      individual_verified: true,
      business_name: true,
      business_verification_status: true,
      created_at: true,
    },
  },
  ad_images: {
    select: {
      id: true,
      filename: true,
      file_path: true,
      original_name: true,
      file_size: true,
      mime_type: true,
      is_primary: true,
      created_at: true,
    },
    orderBy: [{ is_primary: 'desc' as const }, { created_at: 'asc' as const }],
  },
};
