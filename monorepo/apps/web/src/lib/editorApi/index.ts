/**
 * Editor API - Main Export
 *
 * Modular API client for editor dashboard and management.
 *
 * @example
 * // Import specific functions
 * import { getAds, approveAd } from '@/lib/editorApi';
 *
 * @example
 * // Import types
 * import type { Ad, Verification, ApiResponse } from '@/lib/editorApi';
 *
 * @example
 * // Import from specific modules
 * import { getAds } from '@/lib/editorApi/ads';
 * import { getVerifications } from '@/lib/editorApi/verifications';
 */

// ============================================
// Types - Export all interfaces
// ============================================
export type {
  // Base types
  ApiResponse,
  PaginationInfo,
  // Dashboard & Stats
  DashboardStats,
  MyWorkToday,
  NotificationsCount,
  SystemAlert,
  AvgResponseTime,
  AvgResponseTimeTrend,
  Trends,
  // Verifications
  Verification,
  VerificationStatus,
  VerificationType,
  VerificationAction,
  // Ads
  Ad,
  AdStatus,
  SortOrder,
  GetAdsParams,
  ReportedAdsParams,
  // Users
  User,
  UserStatus,
  GetUsersParams,
  // Editors
  Editor,
  EditorProfile,
  CreateEditorData,
  UpdateEditorData,
  // Shops
  ReportedShop,
  ReportedShopsParams,
  // Reports
  Report,
  ReportedAdsCount,
  SupportChatCount,
} from './types';

// ============================================
// Client utilities
// ============================================
export { getBackendToken, apiRequest, apiGet, apiPost, apiPut, apiDelete, buildQueryString } from './client';

// ============================================
// Ads Functions
// ============================================
export {
  getAds,
  approveAd,
  rejectAd,
  deleteAd,
  restoreAd,
  suspendAd,
  unsuspendAd,
  permanentDeleteAd,
  getReportedAds,
  getReportedAdsCount,
  dismissReport,
} from './ads';

// ============================================
// Verifications Functions
// ============================================
export {
  getVerifications,
  getPendingVerifications,
  handleVerificationAction,
  approveBusinessVerification,
  rejectBusinessVerification,
  approveIndividualVerification,
  rejectIndividualVerification,
  reviewBusinessVerification,
  reviewIndividualVerification,
} from './verifications';

// ============================================
// Users Functions
// ============================================
export {
  getUsers,
  suspendUser,
  unsuspendUser,
} from './users';

// ============================================
// Shops Functions
// ============================================
export {
  getReportedShops,
  dismissShopReport,
  suspendShopFromReport,
  unsuspendShopFromReport,
} from './shops';

// ============================================
// Stats Functions
// ============================================
export {
  getEditorStats,
  getMyWorkToday,
  getNotificationsCount,
  getSystemAlerts,
  getAvgResponseTime,
  getAvgResponseTimeTrend,
  getTrends,
  getSupportChatCount,
} from './stats';

// ============================================
// Editors Functions
// ============================================
export {
  getEditorProfile,
  createEditor,
  updateEditor,
} from './editors';
