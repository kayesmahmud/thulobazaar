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

  async getHierarchy(): Promise<ApiResponse<LocationHierarchy[]>> {
    const response = await this.client.get('/api/locations/hierarchy');
    return response.data;
  }

  async searchAllLocations(query: string, limit?: number): Promise<ApiResponse<Location[]>> {
    const response = await this.client.get('/api/locations/search-all', {
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

  // ============================================
  // VERIFICATION ENDPOINTS
  // ============================================

  async submitBusinessVerification(
    data: Partial<BusinessVerificationRequest>
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
    const response = await this.client.post(`/api/super-admin/ads/${adId}/approve`);
    return response.data;
  }

  async rejectAd(adId: number, reason: string): Promise<ApiResponse<Ad>> {
    const response = await this.client.post(`/api/super-admin/ads/${adId}/reject`, { reason });
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
}

// Export a factory function for creating clients
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};
