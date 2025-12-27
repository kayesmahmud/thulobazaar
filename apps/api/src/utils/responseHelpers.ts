import { Response } from 'express';
import { prisma } from '@thulobazaar/database';

/**
 * Log review history for ad actions
 */
export async function logReviewHistory(
  adId: number,
  action: string,
  actorId: number,
  actorType: string,
  reason?: string | null,
  notes?: string | null
) {
  await prisma.ad_review_history.create({
    data: {
      ad_id: adId,
      action,
      actor_id: actorId,
      actor_type: actorType,
      reason: reason || null,
      notes: notes || null,
    },
  });
}

/**
 * Send a successful JSON response
 */
export function success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a paginated JSON response
 */
export function paginated<T>(
  res: Response,
  data: T[],
  pagination: {
    total: number;
    page?: number;
    limit?: number;
    offset?: number;
  },
  message = 'Success'
) {
  const { total, page, limit, offset } = pagination;

  return res.json({
    success: true,
    message,
    data,
    pagination: {
      total,
      ...(page !== undefined && { page }),
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
      ...(limit !== undefined && { hasMore: (offset || 0) + limit < total }),
      ...(page !== undefined && limit !== undefined && { totalPages: Math.ceil(total / limit) }),
    },
  });
}

/**
 * Transform snake_case database fields to camelCase for API response
 */
export function transformUser(dbUser: any) {
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    phone: dbUser.phone,
    role: dbUser.role,
    avatar: dbUser.avatar,
    isActive: dbUser.is_active,
    accountType: dbUser.account_type,
    businessVerified: dbUser.business_verification_status === 'approved',
    individualVerified: dbUser.individual_verified,
    createdAt: dbUser.created_at,
    lastLogin: dbUser.last_login,
  };
}

/**
 * Transform ad database fields to camelCase
 */
export function transformAd(dbAd: any) {
  if (!dbAd) return null;

  return {
    id: dbAd.id,
    title: dbAd.title,
    description: dbAd.description,
    price: dbAd.price,
    condition: dbAd.condition,
    status: dbAd.status,
    statusReason: dbAd.status_reason,
    slug: dbAd.slug,
    viewCount: dbAd.view_count,
    createdAt: dbAd.created_at,
    updatedAt: dbAd.updated_at,
    reviewedAt: dbAd.reviewed_at,
    deletedAt: dbAd.deleted_at,
    suspendedUntil: dbAd.suspended_until,
    categoryId: dbAd.category_id,
    locationId: dbAd.location_id,
    categoryName: dbAd.categories?.name,
    locationName: dbAd.locations?.name,
  };
}
