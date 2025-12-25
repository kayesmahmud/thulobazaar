/**
 * Unified API Client for Web and Mobile
 * This client works on both Next.js and React Native
 */

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

// Export types
export type { ApiClientConfig } from './types';

// Import base and methods
import { BaseApiClient } from './base';
import type { ApiClientConfig } from './types';
import { createAuthMethods } from './methods/auth';
import { createAdMethods } from './methods/ads';
import { createCategoryMethods } from './methods/categories';
import { createLocationMethods } from './methods/locations';
import { createProfileMethods } from './methods/profile';
import { createVerificationMethods } from './methods/verification';
import { createPromotionMethods } from './methods/promotion';
import { createMessagingMethods } from './methods/messaging';
import { createSuperAdminMethods } from './methods/superAdmin';
import { createEditorMethods } from './methods/editor';
import { createAdminMethods } from './methods/admin';
import { createFinancialMethods } from './methods/financial';

/**
 * Full API Client with all methods
 */
export class ApiClient extends BaseApiClient {
  // Auth
  login: ReturnType<typeof createAuthMethods>['login'];
  register: ReturnType<typeof createAuthMethods>['register'];
  logout: ReturnType<typeof createAuthMethods>['logout'];
  getMe: ReturnType<typeof createAuthMethods>['getMe'];

  // Ads
  getAds: ReturnType<typeof createAdMethods>['getAds'];
  getAdById: ReturnType<typeof createAdMethods>['getAdById'];
  getAdBySlug: ReturnType<typeof createAdMethods>['getAdBySlug'];
  searchAds: ReturnType<typeof createAdMethods>['searchAds'];
  createAd: ReturnType<typeof createAdMethods>['createAd'];
  updateAd: ReturnType<typeof createAdMethods>['updateAd'];
  deleteAd: ReturnType<typeof createAdMethods>['deleteAd'];
  markAdAsSold: ReturnType<typeof createAdMethods>['markAdAsSold'];
  incrementAdView: ReturnType<typeof createAdMethods>['incrementAdView'];
  getUserAds: ReturnType<typeof createAdMethods>['getUserAds'];

  // Categories
  getCategories: ReturnType<typeof createCategoryMethods>['getCategories'];
  getCategoryBySlug: ReturnType<typeof createCategoryMethods>['getCategoryBySlug'];

  // Locations
  getLocations: ReturnType<typeof createLocationMethods>['getLocations'];
  getLocationBySlug: ReturnType<typeof createLocationMethods>['getLocationBySlug'];
  searchLocations: ReturnType<typeof createLocationMethods>['searchLocations'];
  getHierarchy: ReturnType<typeof createLocationMethods>['getHierarchy'];
  searchAllLocations: ReturnType<typeof createLocationMethods>['searchAllLocations'];
  getAreasHierarchy: ReturnType<typeof createLocationMethods>['getAreasHierarchy'];
  searchAreas: ReturnType<typeof createLocationMethods>['searchAreas'];

  // Profile
  getUserProfile: ReturnType<typeof createProfileMethods>['getUserProfile'];
  getSellerBySlug: ReturnType<typeof createProfileMethods>['getSellerBySlug'];
  getSellerAds: ReturnType<typeof createProfileMethods>['getSellerAds'];
  getShopBySlug: ReturnType<typeof createProfileMethods>['getShopBySlug'];
  getShopAds: ReturnType<typeof createProfileMethods>['getShopAds'];
  updateProfile: ReturnType<typeof createProfileMethods>['updateProfile'];
  uploadAvatar: ReturnType<typeof createProfileMethods>['uploadAvatar'];
  checkShopSlugAvailability: ReturnType<typeof createProfileMethods>['checkShopSlugAvailability'];
  updateShopSlug: ReturnType<typeof createProfileMethods>['updateShopSlug'];

  // Verification
  submitBusinessVerification: ReturnType<typeof createVerificationMethods>['submitBusinessVerification'];
  submitIndividualVerification: ReturnType<typeof createVerificationMethods>['submitIndividualVerification'];
  getVerificationStatus: ReturnType<typeof createVerificationMethods>['getVerificationStatus'];
  getBusinessVerificationStatus: ReturnType<typeof createVerificationMethods>['getBusinessVerificationStatus'];
  getIndividualVerificationStatus: ReturnType<typeof createVerificationMethods>['getIndividualVerificationStatus'];

  // Promotion
  getPromotionPlans: ReturnType<typeof createPromotionMethods>['getPromotionPlans'];
  createPayment: ReturnType<typeof createPromotionMethods>['createPayment'];
  verifyPayment: ReturnType<typeof createPromotionMethods>['verifyPayment'];
  getPromotionPricing: ReturnType<typeof createPromotionMethods>['getPromotionPricing'];
  calculatePromotionPrice: ReturnType<typeof createPromotionMethods>['calculatePromotionPrice'];
  initiatePayment: ReturnType<typeof createPromotionMethods>['initiatePayment'];
  verifyMockPayment: ReturnType<typeof createPromotionMethods>['verifyMockPayment'];
  getPaymentStatus: ReturnType<typeof createPromotionMethods>['getPaymentStatus'];

  // Messaging
  sendMessage: ReturnType<typeof createMessagingMethods>['sendMessage'];
  getConversations: ReturnType<typeof createMessagingMethods>['getConversations'];
  getMessages: ReturnType<typeof createMessagingMethods>['getMessages'];
  getContactMessages: ReturnType<typeof createMessagingMethods>['getContactMessages'];
  getUnreadCount: ReturnType<typeof createMessagingMethods>['getUnreadCount'];

  // Super Admin
  getSuperAdminStats: ReturnType<typeof createSuperAdminMethods>['getSuperAdminStats'];
  getAllAdsForReview: ReturnType<typeof createSuperAdminMethods>['getAllAdsForReview'];
  approveAd: ReturnType<typeof createSuperAdminMethods>['approveAd'];
  rejectAd: ReturnType<typeof createSuperAdminMethods>['rejectAd'];
  getAllUsers: ReturnType<typeof createSuperAdminMethods>['getAllUsers'];
  toggleUserStatus: ReturnType<typeof createSuperAdminMethods>['toggleUserStatus'];
  getSuperAdminVerificationStats: ReturnType<typeof createSuperAdminMethods>['getSuperAdminVerificationStats'];

  // Editor
  getEditorStats: ReturnType<typeof createEditorMethods>['getEditorStats'];
  getPendingVerifications: ReturnType<typeof createEditorMethods>['getPendingVerifications'];
  getVerificationsByStatus: ReturnType<typeof createEditorMethods>['getVerificationsByStatus'];
  reviewVerification: ReturnType<typeof createEditorMethods>['reviewVerification'];
  getSuspendedRejectedUsers: ReturnType<typeof createEditorMethods>['getSuspendedRejectedUsers'];
  getEditorAds: ReturnType<typeof createEditorMethods>['getEditorAds'];
  getEditors: ReturnType<typeof createEditorMethods>['getEditors'];
  getEditorUsers: ReturnType<typeof createEditorMethods>['getEditorUsers'];
  suspendUser: ReturnType<typeof createEditorMethods>['suspendUser'];
  unsuspendUser: ReturnType<typeof createEditorMethods>['unsuspendUser'];
  verifyUser: ReturnType<typeof createEditorMethods>['verifyUser'];
  unverifyUser: ReturnType<typeof createEditorMethods>['unverifyUser'];
  getSuperAdmins: ReturnType<typeof createEditorMethods>['getSuperAdmins'];
  updateSuperAdmin: ReturnType<typeof createEditorMethods>['updateSuperAdmin'];
  setup2FA: ReturnType<typeof createEditorMethods>['setup2FA'];
  verify2FA: ReturnType<typeof createEditorMethods>['verify2FA'];
  disable2FA: ReturnType<typeof createEditorMethods>['disable2FA'];
  getSystemHealth: ReturnType<typeof createEditorMethods>['getSystemHealth'];
  getSecurityAudit: ReturnType<typeof createEditorMethods>['getSecurityAudit'];
  getAdminCategories: ReturnType<typeof createEditorMethods>['getAdminCategories'];
  createCategory: ReturnType<typeof createEditorMethods>['createCategory'];
  updateCategory: ReturnType<typeof createEditorMethods>['updateCategory'];
  deleteCategory: ReturnType<typeof createEditorMethods>['deleteCategory'];
  getAdminLocations: ReturnType<typeof createEditorMethods>['getAdminLocations'];
  createLocation: ReturnType<typeof createEditorMethods>['createLocation'];
  updateLocation: ReturnType<typeof createEditorMethods>['updateLocation'];
  deleteLocation: ReturnType<typeof createEditorMethods>['deleteLocation'];

  // Admin
  getAdminStats: ReturnType<typeof createAdminMethods>['getAdminStats'];

  // Financial
  getFinancialStats: ReturnType<typeof createFinancialMethods>['getFinancialStats'];
  getFinancialTransactions: ReturnType<typeof createFinancialMethods>['getFinancialTransactions'];
  getAllPromotionPricing: ReturnType<typeof createFinancialMethods>['getAllPromotionPricing'];
  updatePromotionPricing: ReturnType<typeof createFinancialMethods>['updatePromotionPricing'];
  createPromotionPricing: ReturnType<typeof createFinancialMethods>['createPromotionPricing'];
  deletePromotionPricing: ReturnType<typeof createFinancialMethods>['deletePromotionPricing'];

  constructor(config: ApiClientConfig) {
    super(config);

    // Bind auth methods
    const authMethods = createAuthMethods(this.client);
    this.login = authMethods.login;
    this.register = authMethods.register;
    this.logout = authMethods.logout;
    this.getMe = authMethods.getMe;

    // Bind ad methods
    const adMethods = createAdMethods(this.client);
    this.getAds = adMethods.getAds;
    this.getAdById = adMethods.getAdById;
    this.getAdBySlug = adMethods.getAdBySlug;
    this.searchAds = adMethods.searchAds;
    this.createAd = adMethods.createAd;
    this.updateAd = adMethods.updateAd;
    this.deleteAd = adMethods.deleteAd;
    this.markAdAsSold = adMethods.markAdAsSold;
    this.incrementAdView = adMethods.incrementAdView;
    this.getUserAds = adMethods.getUserAds;

    // Bind category methods
    const categoryMethods = createCategoryMethods(this.client);
    this.getCategories = categoryMethods.getCategories;
    this.getCategoryBySlug = categoryMethods.getCategoryBySlug;

    // Bind location methods
    const locationMethods = createLocationMethods(this.client);
    this.getLocations = locationMethods.getLocations;
    this.getLocationBySlug = locationMethods.getLocationBySlug;
    this.searchLocations = locationMethods.searchLocations;
    this.getHierarchy = locationMethods.getHierarchy;
    this.searchAllLocations = locationMethods.searchAllLocations;
    this.getAreasHierarchy = locationMethods.getAreasHierarchy;
    this.searchAreas = locationMethods.searchAreas;

    // Bind profile methods
    const profileMethods = createProfileMethods(this.client);
    this.getUserProfile = profileMethods.getUserProfile;
    this.getSellerBySlug = profileMethods.getSellerBySlug;
    this.getSellerAds = profileMethods.getSellerAds;
    this.getShopBySlug = profileMethods.getShopBySlug;
    this.getShopAds = profileMethods.getShopAds;
    this.updateProfile = profileMethods.updateProfile;
    this.uploadAvatar = profileMethods.uploadAvatar;
    this.checkShopSlugAvailability = profileMethods.checkShopSlugAvailability;
    this.updateShopSlug = profileMethods.updateShopSlug;

    // Bind verification methods
    const verificationMethods = createVerificationMethods(this.client);
    this.submitBusinessVerification = verificationMethods.submitBusinessVerification;
    this.submitIndividualVerification = verificationMethods.submitIndividualVerification;
    this.getVerificationStatus = verificationMethods.getVerificationStatus;
    this.getBusinessVerificationStatus = verificationMethods.getBusinessVerificationStatus;
    this.getIndividualVerificationStatus = verificationMethods.getIndividualVerificationStatus;

    // Bind promotion methods
    const promotionMethods = createPromotionMethods(this.client);
    this.getPromotionPlans = promotionMethods.getPromotionPlans;
    this.createPayment = promotionMethods.createPayment;
    this.verifyPayment = promotionMethods.verifyPayment;
    this.getPromotionPricing = promotionMethods.getPromotionPricing;
    this.calculatePromotionPrice = promotionMethods.calculatePromotionPrice;
    this.initiatePayment = promotionMethods.initiatePayment;
    this.verifyMockPayment = promotionMethods.verifyMockPayment;
    this.getPaymentStatus = promotionMethods.getPaymentStatus;

    // Bind messaging methods
    const messagingMethods = createMessagingMethods(this.client);
    this.sendMessage = messagingMethods.sendMessage;
    this.getConversations = messagingMethods.getConversations;
    this.getMessages = messagingMethods.getMessages;
    this.getContactMessages = messagingMethods.getContactMessages;
    this.getUnreadCount = messagingMethods.getUnreadCount;

    // Bind super admin methods
    const superAdminMethods = createSuperAdminMethods(this.client);
    this.getSuperAdminStats = superAdminMethods.getSuperAdminStats;
    this.getAllAdsForReview = superAdminMethods.getAllAdsForReview;
    this.approveAd = superAdminMethods.approveAd;
    this.rejectAd = superAdminMethods.rejectAd;
    this.getAllUsers = superAdminMethods.getAllUsers;
    this.toggleUserStatus = superAdminMethods.toggleUserStatus;
    this.getSuperAdminVerificationStats = superAdminMethods.getSuperAdminVerificationStats;

    // Bind editor methods
    const editorMethods = createEditorMethods(this.client);
    this.getEditorStats = editorMethods.getEditorStats;
    this.getPendingVerifications = editorMethods.getPendingVerifications;
    this.getVerificationsByStatus = editorMethods.getVerificationsByStatus;
    this.reviewVerification = editorMethods.reviewVerification;
    this.getSuspendedRejectedUsers = editorMethods.getSuspendedRejectedUsers;
    this.getEditorAds = editorMethods.getEditorAds;
    this.getEditors = editorMethods.getEditors;
    this.getEditorUsers = editorMethods.getEditorUsers;
    this.suspendUser = editorMethods.suspendUser;
    this.unsuspendUser = editorMethods.unsuspendUser;
    this.verifyUser = editorMethods.verifyUser;
    this.unverifyUser = editorMethods.unverifyUser;
    this.getSuperAdmins = editorMethods.getSuperAdmins;
    this.updateSuperAdmin = editorMethods.updateSuperAdmin;
    this.setup2FA = editorMethods.setup2FA;
    this.verify2FA = editorMethods.verify2FA;
    this.disable2FA = editorMethods.disable2FA;
    this.getSystemHealth = editorMethods.getSystemHealth;
    this.getSecurityAudit = editorMethods.getSecurityAudit;
    this.getAdminCategories = editorMethods.getAdminCategories;
    this.createCategory = editorMethods.createCategory;
    this.updateCategory = editorMethods.updateCategory;
    this.deleteCategory = editorMethods.deleteCategory;
    this.getAdminLocations = editorMethods.getAdminLocations;
    this.createLocation = editorMethods.createLocation;
    this.updateLocation = editorMethods.updateLocation;
    this.deleteLocation = editorMethods.deleteLocation;

    // Bind admin methods
    const adminMethods = createAdminMethods(this.client, config);
    this.getAdminStats = adminMethods.getAdminStats;

    // Bind financial methods
    const financialMethods = createFinancialMethods(this.client);
    this.getFinancialStats = financialMethods.getFinancialStats;
    this.getFinancialTransactions = financialMethods.getFinancialTransactions;
    this.getAllPromotionPricing = financialMethods.getAllPromotionPricing;
    this.updatePromotionPricing = financialMethods.updatePromotionPricing;
    this.createPromotionPricing = financialMethods.createPromotionPricing;
    this.deletePromotionPricing = financialMethods.deletePromotionPricing;
  }
}

// Export a factory function for creating clients
export const createApiClient = (config: ApiClientConfig): ApiClient => {
  return new ApiClient(config);
};
