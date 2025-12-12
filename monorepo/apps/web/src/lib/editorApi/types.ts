/**
 * Editor API Type Definitions
 */

// ============================================
// Base Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Dashboard & Stats Types
// ============================================

export interface DashboardStats {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  rejectedAds: number;
  pendingVerifications: number;
}

export interface MyWorkToday {
  adsApprovedToday: number;
  adsRejectedToday: number;
  adsEditedToday: number;
  businessVerificationsToday: number;
  individualVerificationsToday: number;
  supportTicketsAssigned: number;
}

export interface NotificationsCount {
  count: number;
  breakdown: {
    urgentReports: number;
    oldPendingAds: number;
    oldVerifications: number;
  };
}

export interface SystemAlert {
  message: string;
  type: 'danger' | 'warning' | 'info';
  count: number;
}

export interface AvgResponseTime {
  avgResponseTime: string;
  breakdown: {
    adsAvgHours: number;
    verificationAvgHours: number;
    combinedAvgHours: number;
  };
}

export interface AvgResponseTimeTrend {
  improvementPercent: number;
  formattedText: string;
  isImproved: boolean;
  breakdown: {
    currentAvgHours: number;
    previousAvgHours: number;
  };
}

export interface Trends {
  pendingChange: string;
  verificationsChange: string;
  breakdown: {
    currentPendingAds: number;
    pastPendingAds: number;
    pendingAdsChangePercent: number;
    currentPendingVerifications: number;
    pastPendingVerifications: number;
    verificationsChangePercent: number;
  };
}

// ============================================
// Verification Types
// ============================================

export type VerificationStatus = 'pending' | 'rejected' | 'approved' | 'all';
export type VerificationType = 'individual' | 'business' | 'all';
export type VerificationAction = 'approve' | 'reject';

export interface Verification {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  type: 'business' | 'individual';
  // Business fields
  business_name?: string;
  business_license_document?: string;
  business_category?: string;
  business_description?: string;
  // Individual fields
  full_name?: string;
  id_document_type?: string;
  id_document_number?: string;
  id_document_front?: string;
  id_document_back?: string;
  selfie_with_id?: string;
  // Common fields
  email: string;
  // Payment and duration fields
  duration_days?: number;
  payment_amount?: number;
  payment_reference?: string;
  payment_status?: 'free' | 'paid' | 'pending';
}

// ============================================
// Ad Types
// ============================================

export type AdStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted';
export type SortOrder = 'ASC' | 'DESC';

export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name: string;
  location_name: string;
  seller_name: string;
  seller_email: string;
  reviewer_name: string | null;
}

export interface GetAdsParams {
  status?: string;
  category?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  includeDeleted?: string;
}

export interface ReportedAdsParams {
  status?: string;
  page?: number;
  limit?: number;
}

// ============================================
// User Types
// ============================================

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  status: UserStatus;
  created_at: string;
  ads_count?: number;
  suspension_reason?: string;
  suspension_expires_at?: string | null;
}

export interface GetUsersParams {
  role?: string;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// ============================================
// Editor Types
// ============================================

export interface Editor {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  avatar?: string | null;
}

export interface EditorProfile {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  avatar: string | null;
}

export interface CreateEditorData {
  fullName: string;
  email: string;
  password: string;
  avatar?: File | null;
}

export interface UpdateEditorData {
  fullName: string;
  email: string;
  password?: string;
  avatar?: File | null;
}

// ============================================
// Shop Types
// ============================================

export interface ReportedShop {
  id: number;
  shop_id: number;
  reporter_id: number;
  reason: string;
  status: string;
  created_at: string;
  shop_name?: string;
  shop_slug?: string;
  reporter_email?: string;
}

export interface ReportedShopsParams {
  status?: string;
  page?: number;
  limit?: number;
}

// ============================================
// Report Types
// ============================================

export interface Report {
  id: number;
  ad_id: number;
  reporter_id: number;
  reason: string;
  status: string;
  created_at: string;
  ad_title?: string;
  reporter_email?: string;
}

export interface ReportedAdsCount {
  count: number;
}

export interface SupportChatCount {
  count: number;
}
