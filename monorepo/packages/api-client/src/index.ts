import axios, { AxiosInstance } from 'axios';
import type {
  User,
  Ad,
  AdWithDetails,
  Category,
  Location,
  LocationHierarchy,
  ApiResponse,
  PaginatedResponse,
  SearchFilters,
  LoginFormData,
  RegisterFormData,
  PostAdFormData,
  BusinessVerificationRequest,
  IndividualVerificationRequest,
  PromotionPlan,
  PaymentTransaction,
  AreasHierarchyResponse,
  Area,
  Message,
  Conversation,
  VerificationStatusResponse,
} from '@thulobazaar/types';

export interface ApiClientConfig {
  baseURL: string;
  getAuthToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

/**
 * Unified API Client for Web and Mobile
 * This client works on both Next.js and React Native
 */
export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor to add auth token and handle FormData
    this.client.interceptors.request.use(async (requestConfig) => {
      if (this.config.getAuthToken) {
        const token = await this.config.getAuthToken();
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
      }

      // If the data is FormData, remove the Content-Type header
      // to let axios/browser set it automatically with the correct boundary
      if (requestConfig.data instanceof FormData) {
        delete requestConfig.headers['Content-Type'];
      }

      return requestConfig;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.config.onUnauthorized?.();
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  async login(data: LoginFormData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/api/auth/login', data);
    return response.data;
  }

  async register(data: RegisterFormData): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/api/auth/register', data);
    return response.data;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
  }

  async getMe(): Promise<ApiResponse<User>> {
    const response = await this.client.get('/api/profile');
    return response.data;
  }

  // ============================================
  // AD ENDPOINTS
  // ============================================

  async getAds(params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    location_id?: number;
    sort_by?: string;
  }): Promise<PaginatedResponse<AdWithDetails>> {
    const response = await this.client.get('/api/ads', { params });
    return response.data;
  }

  async getAdById(id: number): Promise<ApiResponse<AdWithDetails>> {
    const response = await this.client.get(`/api/ads/${id}`);
    return response.data;
  }

  async getAdBySlug(slug: string): Promise<ApiResponse<AdWithDetails>> {
    const response = await this.client.get(`/api/ads/slug/${slug}`);
    return response.data;
  }

  async searchAds(filters: SearchFilters): Promise<PaginatedResponse<AdWithDetails>> {
    const response = await this.client.post('/api/ads/search', filters);
    return response.data;
  }

  async createAd(data: PostAdFormData): Promise<ApiResponse<Ad>> {
    const formData = new FormData();

    // Append basic fields
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('isNegotiable', data.isNegotiable.toString());
    formData.append('categoryId', data.categoryId.toString());

    if (data.subcategoryId) {
      formData.append('subcategoryId', data.subcategoryId.toString());
    }
    if (data.locationId) {
      formData.append('locationId', data.locationId.toString());
    }
    if (data.areaId) {
      formData.append('areaId', data.areaId.toString());
    }
    if (data.latitude) {
      formData.append('latitude', data.latitude.toString());
    }
    if (data.longitude) {
      formData.append('longitude', data.longitude.toString());
    }
    if (data.googleMapsLink) {
      formData.append('googleMapsLink', data.googleMapsLink);
    }
    if (data.attributes) {
      formData.append('attributes', JSON.stringify(data.attributes));
    }

    // Append images
    data.images.forEach((image) => {
      if (image instanceof File) {
        formData.append('images', image);
      }
    });

    const response = await this.client.post('/api/ads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async updateAd(id: number, data: Partial<PostAdFormData> & { existingImages?: string[] }): Promise<ApiResponse<Ad>> {
    const formData = new FormData();

    // Append text fields
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.price !== undefined) {
      formData.append('price', data.price.toString());
    }
    if (data.isNegotiable !== undefined) {
      formData.append('isNegotiable', data.isNegotiable.toString());
    }
    if (data.categoryId) {
      formData.append('categoryId', data.categoryId.toString());
    }
    if (data.subcategoryId) {
      formData.append('subcategoryId', data.subcategoryId.toString());
    }
    if (data.locationId) {
      formData.append('locationId', data.locationId.toString());
    }
    if (data.areaId) {
      formData.append('areaId', data.areaId.toString());
    }
    if (data.latitude) {
      formData.append('latitude', data.latitude.toString());
    }
    if (data.longitude) {
      formData.append('longitude', data.longitude.toString());
    }
    if (data.googleMapsLink) {
      formData.append('googleMapsLink', data.googleMapsLink);
    }
    if (data.attributes) {
      formData.append('attributes', JSON.stringify(data.attributes));
    }
    if (data.status) {
      formData.append('status', data.status);
    }

    // Append existing images as JSON array (paths to keep)
    if (data.existingImages) {
      formData.append('existingImages', JSON.stringify(data.existingImages));
    }

    // Append new image files
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((image) => {
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }

    const response = await this.client.put(`/api/ads/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  }

  async deleteAd(id: number): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/api/ads/${id}`);
    return response.data;
  }

  async incrementAdView(id: number): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/api/ads/${id}/view`);
    return response.data;
  }

  async getUserAds(): Promise<ApiResponse<AdWithDetails[]>> {
    const response = await this.client.get('/api/ads/my-ads');
    return response.data;
  }

  // ============================================
  // CATEGORY ENDPOINTS
  // ============================================

  async getCategories(params?: {
    includeSubcategories?: boolean;
    parent_id?: number | null;
  }): Promise<ApiResponse<Category[]>> {
    const response = await this.client.get('/api/categories', { params });
    return response.data;
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    const response = await this.client.get(`/api/categories/slug/${slug}`);
    return response.data;
  }

  // ============================================
  // LOCATION ENDPOINTS
  // ============================================

  async getLocations(params?: {
    type?: string;
    parent_id?: number;
  }): Promise<ApiResponse<Location[]>> {
    const response = await this.client.get('/api/locations', { params });
    return response.data;
  }

  async getLocationBySlug(slug: string): Promise<ApiResponse<Location>> {
    const response = await this.client.get(`/api/locations/slug/${slug}`);
    return response.data;
  }

  async searchLocations(query: string): Promise<ApiResponse<Location[]>> {
    const response = await this.client.get('/api/locations/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getHierarchy(provinceId?: number): Promise<ApiResponse<LocationHierarchy[]>> {
    const url = provinceId
      ? `/api/locations/hierarchy?provinceId=${provinceId}`
      : '/api/locations/hierarchy';
    const response = await this.client.get(url);
    return response.data;
  }

  async searchAllLocations(query: string, limit?: number): Promise<ApiResponse<Location[]>> {
    const response = await this.client.get('/api/locations/search', {
      params: { q: query, limit },
    });
    return response.data;
  }

  // ============================================
  // AREAS ENDPOINTS (for hierarchical location selection with areas)
  // ============================================
  async getAreasHierarchy(provinceId?: number): Promise<ApiResponse<AreasHierarchyResponse>> {
    const response = await this.client.get('/api/areas/hierarchy', {
      params: provinceId ? { province_id: provinceId } : {},
    });
    return response.data;
  }

  async searchAreas(query: string, limit?: number): Promise<ApiResponse<Area[]>> {
    const response = await this.client.get('/api/areas/search', {
      params: { q: query, limit },
    });
    return response.data;
  }

  // ============================================
  // USER/PROFILE ENDPOINTS
  // ============================================

  async getUserProfile(userId: number): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/api/users/${userId}`);
    return response.data;
  }

  async getSellerBySlug(sellerSlug: string): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/api/seller/${sellerSlug}`);
    return response.data;
  }

  async getSellerAds(sellerSlug: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdWithDetails>> {
    const response = await this.client.get(`/api/seller/${sellerSlug}/ads`, { params });
    return response.data;
  }

  async getShopBySlug(shopSlug: string): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/api/shop/${shopSlug}`);
    return response.data;
  }

  async getShopAds(shopSlug: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdWithDetails>> {
    const response = await this.client.get(`/api/shop/${shopSlug}/ads`, { params });
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put('/api/profile', data);
    return response.data;
  }

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.client.post('/api/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async checkShopSlugAvailability(slug: string): Promise<ApiResponse<{ available: boolean }>> {
    const response = await this.client.get('/api/shop/check-slug', {
      params: { slug },
    });
    return response.data;
  }

  async updateShopSlug(slug: string): Promise<ApiResponse<{ shopSlug: string }>> {
    const response = await this.client.put('/api/shop/update-slug', { slug });
    return response.data;
  }

  // ============================================
  // VERIFICATION ENDPOINTS
  // ============================================

  async submitBusinessVerification(
    data: Partial<BusinessVerificationRequest> | FormData
  ): Promise<ApiResponse<BusinessVerificationRequest>> {
    const response = await this.client.post('/api/verification/business', data);
    return response.data;
  }

  async submitIndividualVerification(
    data: Partial<IndividualVerificationRequest> | FormData
  ): Promise<ApiResponse<IndividualVerificationRequest>> {
    // The request interceptor will automatically handle FormData vs JSON
    const response = await this.client.post('/api/verification/individual', data);
    return response.data;
  }

  async getVerificationStatus(): Promise<ApiResponse<VerificationStatusResponse>> {
    const response = await this.client.get('/api/verification/status');
    return response.data;
  }

  async getBusinessVerificationStatus(): Promise<ApiResponse<BusinessVerificationRequest>> {
    const response = await this.client.get('/api/business-verification/status');
    return response.data;
  }

  async getIndividualVerificationStatus(): Promise<ApiResponse<IndividualVerificationRequest>> {
    const response = await this.client.get('/api/individual-verification/status');
    return response.data;
  }

  // ============================================
  // PROMOTION ENDPOINTS
  // ============================================

  async getPromotionPlans(): Promise<ApiResponse<PromotionPlan[]>> {
    const response = await this.client.get('/api/promotions/plans');
    return response.data;
  }

  async createPayment(data: {
    ad_id: number;
    promotion_plan_id: number;
    payment_method: 'esewa' | 'khalti' | 'card';
  }): Promise<ApiResponse<PaymentTransaction>> {
    const response = await this.client.post('/api/payments', data);
    return response.data;
  }

  async verifyPayment(transactionId: string): Promise<ApiResponse<PaymentTransaction>> {
    const response = await this.client.post('/api/payments/verify', { transaction_id: transactionId });
    return response.data;
  }

  // ============================================
  // NEW PROMOTION SYSTEM (with pricing tiers)
  // ============================================

  async getPromotionPricing(): Promise<ApiResponse<{
    pricing: {
      [promotionType: string]: {
        [duration: number]: {
          individual: { price: number; discount_percentage: number };
          individual_verified: { price: number; discount_percentage: number };
          business: { price: number; discount_percentage: number };
        };
      };
    };
    raw: any[];
  }>> {
    const response = await this.client.get('/api/promotion-pricing');
    return response.data;
  }

  async calculatePromotionPrice(params: {
    promotionType: string;
    durationDays: number;
    adId?: number;
  }): Promise<ApiResponse<{
    promotionType: string;
    durationDays: number;
    accountType: string;
    price: number;
    discountPercentage: number;
    currency: string;
  }>> {
    const response = await this.client.get('/api/promotion-pricing/calculate', { params });
    return response.data;
  }

  async initiatePayment(data: {
    amount: number;
    paymentType: string;
    relatedId?: number;
    metadata?: {
      adId: number;
      promotionType: string;
      durationDays: number;
    };
  }): Promise<ApiResponse<{
    paymentTransactionId: number;
    transactionId: string;
    paymentUrl: string;
    amount: number;
    productName: string;
    gateway: string;
    message: string;
  }>> {
    const response = await this.client.post('/api/mock-payment/initiate', data);
    return response.data;
  }

  async verifyMockPayment(transactionId: string, amount: number): Promise<ApiResponse<{
    transactionId: string;
    amount: number;
    status: string;
    verifiedAt: string;
    promotionActivated: boolean;
  }>> {
    const response = await this.client.post('/api/mock-payment/verify', {
      transactionId,
      amount
    });
    return response.data;
  }

  async getPaymentStatus(transactionId: string): Promise<ApiResponse<{
    payment: {
      id: number;
      transactionId: string;
      paymentType: string;
      amount: number;
      status: string;
      createdAt: string;
      verifiedAt: string | null;
      metadata: any;
    };
  }>> {
    const response = await this.client.get(`/api/mock-payment/status/${transactionId}`);
    return response.data;
  }

  // ============================================
  // MESSAGING ENDPOINTS
  // ============================================

  async sendMessage(data: {
    recipient_id: number;
    ad_id?: number;
    message: string;
  }): Promise<ApiResponse<void>> {
    const response = await this.client.post('/api/messages', data);
    return response.data;
  }

  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await this.client.get('/api/messages/conversations');
    return response.data;
  }

  async getMessages(conversationId: number): Promise<ApiResponse<Message[]>> {
    const response = await this.client.get(`/api/messages/${conversationId}`);
    return response.data;
  }

  async getContactMessages(type: 'sent' | 'received'): Promise<ApiResponse<Message[]>> {
    const response = await this.client.get(`/api/contact-messages/${type}`);
    return response.data;
  }

  // ============================================
  // SUPER ADMIN ENDPOINTS
  // ============================================

  async getSuperAdminStats(): Promise<ApiResponse<{
    totalAds: number;
    pendingAds: number;
    activeAds: number;
    rejectedAds: number;
    totalUsers: number;
    activeUsers: number;
    totalViews: number;
    todayAds: number;
  }>> {
    const response = await this.client.get('/api/super-admin/stats');
    return response.data;
  }

  async getAllAdsForReview(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdWithDetails>> {
    const response = await this.client.get('/api/super-admin/ads', { params });
    return response.data;
  }

  async approveAd(adId: number): Promise<ApiResponse<Ad>> {
    // Use editor endpoint which works for both editors and super admins
    const response = await this.client.put(`/api/editor/ads/${adId}/approve`);
    return response.data;
  }

  async rejectAd(adId: number, reason: string): Promise<ApiResponse<Ad>> {
    // Use editor endpoint which works for both editors and super admins
    const response = await this.client.put(`/api/editor/ads/${adId}/reject`, { reason });
    return response.data;
  }

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<User[]>> {
    const response = await this.client.get('/api/super-admin/users', { params });
    return response.data;
  }

  async toggleUserStatus(userId: number): Promise<ApiResponse<User>> {
    const response = await this.client.post(`/api/super-admin/users/${userId}/toggle-status`);
    return response.data;
  }

  // ============================================
  // EDITOR ENDPOINTS
  // ============================================

  async getEditorStats(): Promise<ApiResponse<{
    totalAds: number;
    pendingAds: number;
    activeAds: number;
    rejectedAds: number;
    pendingVerifications: number;
  }>> {
    const response = await this.client.get('/api/editor/stats');
    return response.data;
  }

  async getPendingVerifications(): Promise<ApiResponse<(BusinessVerificationRequest | IndividualVerificationRequest)[]>> {
    const response = await this.client.get('/api/editor/verifications');
    return response.data;
  }

  async reviewVerification(
    verificationId: number,
    type: 'business' | 'individual',
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ApiResponse<BusinessVerificationRequest | IndividualVerificationRequest>> {
    const response = await this.client.post(`/api/editor/verifications/${type}/${verificationId}/${action}`, {
      reason
    });
    return response.data;
  }

  // ============================================
  // ADMIN ENDPOINTS (Super Admin Dashboard)
  // ============================================

  async getAdminStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    adsThisWeek: number;
    usersThisWeek: number;
    totalViews: number;
    todayAds: number;
    topCategories: any[];
  }>> {
    const isBrowser = typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined';

    if (isBrowser) {
      try {
        const token = this.config.getAuthToken ? await this.config.getAuthToken() : null;
        const response = await axios.get('/api/admin/stats', {
          baseURL: '',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
      } catch (browserError) {
        console.warn('[api-client] Local admin stats route failed, falling back to API base URL', browserError);
      }
    }

    const response = await this.client.get('/api/admin/stats');
    return response.data;
  }

  async getEditorActivityLogs(params?: {
    adminId?: number;
    actionType?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    data: Array<{
      id: number;
      action_type: string;
      target_type: string;
      target_id: number;
      details: any;
      ip_address: string;
      created_at: string;
      admin_name: string;
      admin_email: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const response = await this.client.get('/api/editor/activity-logs', { params });
    return response.data;
  }

  async getEditorAds(params?: {
    status?: string;
    category?: string;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeDeleted?: string;
  }): Promise<ApiResponse<{
    data: Array<any>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const response = await this.client.get('/api/editor/ads', { params });
    return response.data;
  }

  async getEditors(): Promise<ApiResponse<Array<{
    id: number;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
    avatar: string | null;
    total_actions: number;
  }>>> {
    const response = await this.client.get('/api/editor/editors');
    return response.data;
  }

  async getEditorUsers(params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    data: Array<any>;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const response = await this.client.get('/api/super-admin/users', { params });
    // Simple endpoint returns flat array, wrap it in expected format
    if (response.data.success && Array.isArray(response.data.data)) {
      return {
        success: true,
        data: {
          data: response.data.data,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 20,
            total: response.data.data.length,
            totalPages: 1,
          },
        },
      };
    }
    return response.data;
  }

  async suspendUser(userId: number, reason: string, duration?: number): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/editor/users/${userId}/suspend`, {
      reason,
      duration,
    });
    return response.data;
  }

  async unsuspendUser(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/editor/users/${userId}/unsuspend`);
    return response.data;
  }

  async verifyUser(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/editor/users/${userId}/verify`);
    return response.data;
  }

  async unverifyUser(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/editor/users/${userId}/unverify`);
    return response.data;
  }

  // Promotion Pricing Methods
  async getAllPromotionPricing(): Promise<ApiResponse<Array<any>>> {
    const response = await this.client.get('/api/promotion-pricing/admin/all');
    return response.data;
  }

  async updatePromotionPricing(id: number, data: {
    price: number;
    discount_percentage?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/promotion-pricing/${id}`, data);
    return response.data;
  }

  async createPromotionPricing(data: {
    promotion_type: string;
    duration_days: number;
    account_type: string;
    price: number;
    discount_percentage?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/api/promotion-pricing', data);
    return response.data;
  }

  async deletePromotionPricing(id: number): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/api/promotion-pricing/${id}`);
    return response.data;
  }

  // ============================================
  // FINANCIAL TRACKING ENDPOINTS
  // ============================================

  async getFinancialStats(params?: {
    period?: 'today' | 'yesterday' | 'thisweek' | 'thismonth' | '7days' | '30days' | '90days' | 'all';
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{
    summary: {
      totalRevenue: number;
      totalTransactions: number;
      failedTransactions: {
        count: number;
        amount: number;
      };
      pendingTransactions: {
        count: number;
        amount: number;
      };
    };
    revenueByGateway: Array<{
      gateway: string;
      revenue: number;
      transactions: number;
    }>;
    revenueByType: Array<{
      type: string;
      revenue: number;
      transactions: number;
    }>;
    promotionStats: Array<{
      promotionType: string;
      totalPromotions: number;
      totalRevenue: number;
      activePromotions: number;
    }>;
    dailyRevenue: Array<{
      date: string;
      revenue: number;
      transactions: number;
    }>;
    topCustomers: Array<{
      id: number;
      fullName: string;
      email: string;
      totalSpent: number;
      transactions: number;
    }>;
  }>> {
    const response = await this.client.get('/api/editor/financial/stats', { params });
    return response.data;
  }

  async getFinancialTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    gateway?: string;
    type?: string;
  }): Promise<ApiResponse<{
    transactions: Array<any>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const response = await this.client.get('/api/editor/financial/transactions', { params });
    return response.data;
  }

  async getSuperAdmins(): Promise<ApiResponse<Array<any>>> {
    const response = await this.client.get('/api/editor/super-admins');
    return response.data;
  }

  async updateSuperAdmin(
    id: number,
    data: {
      email?: string;
      password?: string;
      full_name?: string;
      two_factor_enabled?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/api/editor/super-admins/${id}`, data);
    return response.data;
  }

  // 2FA Methods
  async setup2FA(userId: number): Promise<ApiResponse<{ secret: string; qrCode: string }>> {
    const response = await this.client.post(`/api/editor/super-admins/${userId}/2fa/setup`);
    return response.data;
  }

  async verify2FA(userId: number, data: { secret: string; token: string }): Promise<ApiResponse<{ backupCodes: string[] }>> {
    const response = await this.client.post(`/api/editor/super-admins/${userId}/2fa/verify`, data);
    return response.data;
  }

  async disable2FA(userId: number): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/api/editor/super-admins/${userId}/2fa/disable`);
    return response.data;
  }

  // System Health
  async getSystemHealth(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/api/editor/system-health');
    return response.data;
  }

  // Security & Audit
  async getSecurityAudit(params?: {
    timeRange?: '1h' | '24h' | '7d' | '30d';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.get('/api/editor/security-audit', { params });
    return response.data;
  }

  // ============================================
  // CATEGORIES MANAGEMENT (Super Admin)
  // ============================================

  async getAdminCategories(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/api/editor/categories');
    return response.data;
  }

  async createCategory(data: {
    name: string;
    slug: string;
    icon?: string;
    parent_id?: number;
    form_template?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/api/editor/categories', data);
    return response.data;
  }

  async updateCategory(id: number, data: {
    name?: string;
    slug?: string;
    icon?: string;
    parent_id?: number;
    form_template?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/editor/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/api/editor/categories/${id}`);
    return response.data;
  }

  // ============================================
  // LOCATIONS MANAGEMENT (Super Admin)
  // ============================================

  async getAdminLocations(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/api/editor/locations');
    return response.data;
  }

  async createLocation(data: {
    name: string;
    slug?: string;
    type: 'country' | 'region' | 'city' | 'district';
    parent_id?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/api/editor/locations', data);
    return response.data;
  }

  async updateLocation(id: number, data: {
    name?: string;
    slug?: string;
    type?: 'country' | 'region' | 'city' | 'district';
    parent_id?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/api/editor/locations/${id}`, data);
    return response.data;
  }

  async deleteLocation(id: number): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/api/editor/locations/${id}`);
    return response.data;
  }
}

// Export a factory function for creating clients
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};
