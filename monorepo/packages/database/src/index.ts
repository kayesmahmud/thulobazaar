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
  business_subscriptions,
  business_verification_requests,
  contact_messages,
  conversation_participants,
  conversations,
  editor_permissions,
  individual_verification_requests,
  message_read_receipts,
  messages,
  payment_transactions,
  promotion_pricing,
  typing_indicators,
  user_favorites,
} from '@prisma/client';

// Export Prisma namespace for advanced types
export { Prisma } from '@prisma/client';
