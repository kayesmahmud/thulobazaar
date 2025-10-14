/**
 * API Index - Central export point
 *
 * This file maintains backward compatibility with the old api.js
 * by re-exporting all API methods under a single ApiService object.
 *
 * You can also import individual modules:
 * import { authAPI, adsAPI } from './api';
 * import authAPI from './api/auth';
 */

// Import all modules
import * as authAPI from './auth.js';
import * as adsAPI from './ads.js';
import * as categoriesAPI from './categories.js';
import * as locationsAPI from './locations.js';
import * as adminAPI from './admin.js';
import * as verificationAPI from './verification.js';
import * as promotionAPI from './promotion.js';
import * as messagingAPI from './messaging.js';
import * as clientAPI from './client.js';

// Create unified ApiService object for backward compatibility
const ApiService = {
  // Client methods
  get: clientAPI.get,
  post: clientAPI.post,
  put: clientAPI.put,
  delete: clientAPI.del,
  apiRequest: clientAPI.apiRequest,
  getAuthToken: clientAPI.getAuthToken,
  getEditorToken: clientAPI.getEditorToken,

  // Auth methods
  login: authAPI.login,
  register: authAPI.register,
  getProfile: authAPI.getProfile,
  updateProfile: authAPI.updateProfile,
  uploadAvatar: authAPI.uploadAvatar,
  uploadCoverPhoto: authAPI.uploadCoverPhoto,
  removeAvatar: authAPI.removeAvatar,
  removeCoverPhoto: authAPI.removeCoverPhoto,

  // Ad methods
  getAds: adsAPI.getAds,
  getAd: adsAPI.getAd,
  createAd: adsAPI.createAd,
  updateAd: adsAPI.updateAd,
  deleteAd: adsAPI.deleteAd,
  getUserAds: adsAPI.getUserAds,

  // Category methods
  getCategories: categoriesAPI.getCategories,

  // Location methods
  getLocations: locationsAPI.getLocations,
  getLocationHierarchy: locationsAPI.getLocationHierarchy,
  searchLocations: locationsAPI.searchLocations,
  searchAllLocations: locationsAPI.searchAllLocations,

  // Admin methods
  getAdminStats: adminAPI.getAdminStats,
  getAdminAds: adminAPI.getAdminAds,
  getAdminUsers: adminAPI.getAdminUsers,
  updateAdStatus: adminAPI.updateAdStatus,
  getEditorStats: adminAPI.getEditorStats,
  getEditorAds: adminAPI.getEditorAds,
  getEditorUsers: adminAPI.getEditorUsers,
  getActivityLogs: adminAPI.getActivityLogs,
  approveAd: adminAPI.approveAd,
  rejectAd: adminAPI.rejectAd,
  editorDeleteAd: adminAPI.editorDeleteAd,
  restoreAd: adminAPI.restoreAd,
  bulkActionAds: adminAPI.bulkActionAds,
  suspendUser: adminAPI.suspendUser,
  unsuspendUser: adminAPI.unsuspendUser,
  verifyUser: adminAPI.verifyUser,

  // Verification methods (Business)
  getBusinessVerificationStatus: verificationAPI.getBusinessVerificationStatus,
  submitBusinessVerification: verificationAPI.submitBusinessVerification,
  getBusinessRequests: verificationAPI.getBusinessRequests,
  approveBusinessRequest: verificationAPI.approveBusinessRequest,
  rejectBusinessRequest: verificationAPI.rejectBusinessRequest,

  // Verification methods (Individual)
  getIndividualVerificationStatus: verificationAPI.getIndividualVerificationStatus,
  submitIndividualVerification: verificationAPI.submitIndividualVerification,
  getIndividualRequests: verificationAPI.getIndividualRequests,
  approveIndividualRequest: verificationAPI.approveIndividualRequest,
  rejectIndividualRequest: verificationAPI.rejectIndividualRequest,

  // Promotion methods
  getPromotionPricing: promotionAPI.getPromotionPricing,
  calculatePromotionPrice: promotionAPI.calculatePromotionPrice,
  getAllPromotionPricing: promotionAPI.getAllPromotionPricing,
  updatePromotionPrice: promotionAPI.updatePromotionPrice,

  // Payment methods
  initiatePayment: promotionAPI.initiatePayment,
  verifyPayment: promotionAPI.verifyPayment,
  getPaymentStatus: promotionAPI.getPaymentStatus,

  // Messaging methods
  contactSeller: messagingAPI.contactSeller,
  reportAd: messagingAPI.reportAd,
  getContactMessages: messagingAPI.getContactMessages,
  replyToMessage: messagingAPI.replyToMessage
};

// Export individual modules (for modern imports)
export {
  authAPI,
  adsAPI,
  categoriesAPI,
  locationsAPI,
  adminAPI,
  verificationAPI,
  promotionAPI,
  messagingAPI,
  clientAPI
};

// Export unified ApiService (for backward compatibility)
export default ApiService;
