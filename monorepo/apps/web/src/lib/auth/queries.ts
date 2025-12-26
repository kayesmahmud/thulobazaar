// Prisma select queries for user authentication

export const userSelectBase = {
  id: true,
  email: true,
  full_name: true,
  phone: true,
  role: true,
  avatar: true,
  is_active: true,
  account_type: true,
  shop_slug: true,
  custom_shop_slug: true,
  business_name: true,
  business_verification_status: true,
  individual_verified: true,
} as const;

export const userSelectForAuth = {
  ...userSelectBase,
  password_hash: true,
  is_suspended: true,
  last_login: true,
  two_factor_enabled: true,
  two_factor_secret: true,
  two_factor_backup_codes: true,
  deleted_at: true,
  deletion_requested_at: true,
} as const;

export const userSelectForOAuth = {
  ...userSelectBase,
  oauth_provider: true,
} as const;
