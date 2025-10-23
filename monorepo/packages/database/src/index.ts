// Export Prisma Client instance
export { prisma } from './client';

// Re-export Prisma types for convenience
export type {
  ads,
  users,
  categories,
  locations,
  ad_images,
  ad_promotions,
  ad_reports,
  admin_activity_logs,
  admins,
  areas,
  business_subscriptions,
  business_verification_requests,
  editors,
  individual_verification_requests,
  messages,
  payment_transactions,
  promotion_pricing,
  user_profiles,
} from '@prisma/client';

// Export Prisma namespace for advanced types
export { Prisma } from '@prisma/client';
