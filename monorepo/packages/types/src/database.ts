/**
 * DATABASE TYPES (snake_case)
 * These match the EXACT PostgreSQL schema
 * NEVER change these without checking the actual database schema!
 */

// ============================================
// DATABASE USER TYPE (Exact DB Schema)
// ============================================

export type DbUserRole = 'user' | 'editor' | 'super_admin';
export type DbAccountType = 'individual' | 'business';
export type DbVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  location_id: number | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  role: DbUserRole;
  bio: string | null;
  avatar: string | null;
  cover_photo: string | null;
  verified_at: Date | null;
  verified_by: number | null;
  is_suspended: boolean;
  suspended_at: Date | null;
  suspended_until: Date | null;
  suspended_by: number | null;
  suspension_reason: string | null;
  account_type: DbAccountType;
  business_name: string | null;
  business_license_document: string | null;
  business_verification_status: DbVerificationStatus | null;
  business_verified_at: Date | null;
  business_verified_by: number | null;
  individual_verified: boolean;
  seller_slug: string | null;
  shop_slug: string | null;
}

// ============================================
// DATABASE AD TYPE (Exact DB Schema)
// ============================================

export type DbAdStatus = 'pending' | 'active' | 'sold' | 'rejected' | 'expired';

export interface DbAd {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  location_id: number | null;
  area_id: number | null;
  seller_name: string | null;
  seller_phone: string | null;
  condition: string;
  status: DbAdStatus;
  view_count: number;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  user_id: number | null;
  status_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  latitude: number | null;
  longitude: number | null;
  deleted_at: Date | null;
  deleted_by: number | null;
  deletion_reason: string | null;
  is_bumped: boolean;
  bump_expires_at: Date | null;
  is_sticky: boolean;
  sticky_expires_at: Date | null;
  is_urgent: boolean;
  urgent_expires_at: Date | null;
  total_promotions: number;
  last_promoted_at: Date | null;
  slug: string | null;
  featured_until: Date | null;
  urgent_until: Date | null;
  sticky_until: Date | null;
  promoted_at: Date | null;
}

// ============================================
// DATABASE CATEGORY TYPE
// ============================================

export interface DbCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// DATABASE LOCATION TYPE
// ============================================

export type DbLocationType = 'province' | 'district' | 'municipality' | 'area' | 'ward';

export interface DbLocation {
  id: number;
  name: string;
  slug: string;
  type: DbLocationType;
  parent_id: number | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// DATABASE BUSINESS VERIFICATION TYPE
// ============================================

export interface DbBusinessVerificationRequest {
  id: number;
  user_id: number;
  business_name: string;
  registration_number: string | null;
  pan_number: string | null;
  status: DbVerificationStatus;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
  verified_at: Date | null;
  verified_by: number | null;
}

// ============================================
// DATABASE INDIVIDUAL VERIFICATION TYPE
// ============================================

export interface DbIndividualVerificationRequest {
  id: number;
  user_id: number;
  full_name: string;
  id_type: 'citizenship' | 'passport' | 'license';
  id_number: string;
  id_front_image: string;
  id_back_image: string | null;
  selfie_image: string;
  status: DbVerificationStatus;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
  verified_at: Date | null;
  verified_by: number | null;
}
