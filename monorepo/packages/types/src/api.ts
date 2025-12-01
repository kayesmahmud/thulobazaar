/**
 * API TYPES (camelCase)
 * These are used in frontend/mobile for better TypeScript/JavaScript conventions
 * These will be transformed FROM database types
 */

// ============================================
// API USER TYPES
// ============================================

export type UserRole = 'user' | 'editor' | 'super_admin';
export type AccountType = 'individual' | 'business';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  accountType: AccountType;
  businessVerificationStatus?: VerificationStatus;
  individualVerified: boolean;
  sellerSlug?: string;
  shopSlug?: string;
  isActive: boolean;
  locationId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  bio?: string;
  coverPhoto?: string;
  totalAds?: number;
  activeAds?: number;
}

// ============================================
// API AD TYPES
// ============================================

export type AdStatus = 'pending' | 'active' | 'sold' | 'rejected' | 'expired';
export type PromotionType = 'featured' | 'urgent' | 'spotlight' | 'homepage';

export interface Ad {
  id: number;
  userId: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  subcategoryId?: number;
  locationId: number;
  areaId?: number;
  slug: string;
  status: AdStatus;
  images: string[];
  thumbnail?: string;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
  viewCount: number;
  isNegotiable: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Promotion fields
  isFeatured?: boolean;
  isUrgent?: boolean;
  isSticky?: boolean;
  featuredUntil?: Date;
  urgentUntil?: Date;
  stickyUntil?: Date;

  // Category-specific attributes (flexible JSON)
  attributes?: Record<string, any>;
}

export interface AdWithDetails extends Ad {
  userName: string;
  userAvatar?: string;
  userPhone?: string;
  userVerified: boolean;
  categoryName: string;
  subcategoryName?: string;
  locationName: string;
  areaName?: string;
}

// ============================================
// API CATEGORY TYPES
// ============================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  parentId?: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

// ============================================
// API LOCATION TYPES
// ============================================

export type LocationType = 'province' | 'district' | 'municipality' | 'area';

export interface Location {
  id: number;
  name: string;
  slug: string;
  type: LocationType;
  parentId?: number;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface LocationHierarchy extends Location {
  children?: LocationHierarchy[];
  parentName?: string;
}

// Areas hierarchy types (for cascading dropdowns)
export interface Municipality {
  id: number;
  name: string;
  type: string;
  area_count: number;
  areas?: Area[];
}

export interface District {
  id: number;
  name: string;
  area_count: number;
  municipalities: Municipality[];
}

export interface Province {
  id: number;
  name: string;
  districts?: District[];
}

export interface Area {
  id: number;
  name: string;
  listing_count?: number;
  is_popular?: boolean;
}

export interface AreasHierarchyResponse {
  province_id: number;
  districts: District[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Discriminated Union for API Responses (2025 Best Practice)
 * This ensures TypeScript knows exactly which properties exist based on success status
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; message?: string };

/**
 * Legacy interface for backwards compatibility
 * @deprecated Use the discriminated union ApiResponse<T> instead
 */
export interface ApiResponseLegacy<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// API SEARCH TYPES
// ============================================

export interface SearchFilters {
  query?: string;
  categoryId?: number;
  subcategoryId?: number;
  locationId?: number;
  areaId?: number;
  minPrice?: number;
  maxPrice?: number;
  isNegotiable?: boolean;
  sortBy?: 'date' | 'price' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  ads: AdWithDetails[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
}

// ============================================
// API VERIFICATION TYPES
// ============================================

export interface BusinessVerificationRequest {
  id: number;
  userId: number;
  businessName: string;
  registrationNumber?: string;
  panNumber?: string;
  documents: string[];
  status: VerificationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndividualVerificationRequest {
  id: number;
  userId: number;
  fullName: string;
  idType: 'citizenship' | 'passport' | 'license';
  idNumber: string;
  idFrontImage: string;
  idBackImage?: string;
  selfieImage: string;
  status: VerificationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API PROMOTION TYPES
// ============================================

export interface PromotionPlan {
  id: number;
  name: string;
  type: PromotionType;
  durationDays: number;
  price: number;
  features: string[];
  isActive: boolean;
}

export interface PaymentTransaction {
  id: number;
  userId: number;
  adId: number;
  promotionPlanId: number;
  amount: number;
  paymentMethod: 'esewa' | 'khalti' | 'card';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API FORM TYPES
// ============================================

export interface PostAdFormData {
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  categoryId: number;
  subcategoryId?: number;
  locationId: number;
  areaId?: number;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
  images: File[] | string[];
  attributes?: Record<string, any>;
  status?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  accountType: AccountType;
}

// ============================================
// API MESSAGING TYPES
// ============================================

export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  adId: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  adTitle?: string;
  adId?: number;
}

export interface VerificationStatusResponse {
  business?: BusinessVerificationRequest;
  individual?: IndividualVerificationRequest;
}
