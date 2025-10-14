/**
 * API Service - Backward compatibility layer
 *
 * This file has been refactored. The original 1,204-line api.js
 * has been split into domain-specific modules in /src/api/
 *
 * All imports are redirected to the new structure for backward compatibility.
 *
 * New structure:
 * - /src/api/client.js - Shared fetch wrapper with error handling & logging
 * - /src/api/auth.js - Authentication methods
 * - /src/api/ads.js - Ad management methods
 * - /src/api/categories.js - Category methods
 * - /src/api/locations.js - Location methods
 * - /src/api/admin.js - Admin methods
 * - /src/api/verification.js - Verification methods
 * - /src/api/promotion.js - Promotion methods
 * - /src/api/messaging.js - Messaging methods
 * - /src/api/index.js - Central export point
 *
 * To use the new modular structure directly:
 *   import { authAPI, adsAPI } from '../api';
 *   import authAPI from '../api/auth';
 */

// Re-export everything from the new API structure
export { default } from '../api/index.js';
export * from '../api/index.js';
