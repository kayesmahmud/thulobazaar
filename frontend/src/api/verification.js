/**
 * Verification API
 *
 * Handles all business and individual verification operations
 */

import { API_BASE_URL } from '../config/env.js';
import { get, post, put } from './client.js';

// ============================================================================
// BUSINESS VERIFICATION
// ============================================================================

/**
 * Get business verification status
 */
export async function getBusinessVerificationStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/verification/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    return null;
  }
}

/**
 * Submit business verification
 */
export async function submitBusinessVerification(formData) {
  const data = await post('/verification/business', formData, true);
  return data;
}

/**
 * Get business verification requests (Editor)
 */
export async function getBusinessRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const data = await get(`/business/verification-requests${params ? `?${params}` : ''}`, false, true);
  return data;
}

/**
 * Approve business verification request (Editor)
 */
export async function approveBusinessRequest(requestId, subscriptionMonths) {
  const data = await put(`/business/verification-requests/${requestId}/approve`, {
    subscriptionMonths
  }, false, true);
  return data;
}

/**
 * Reject business verification request (Editor)
 */
export async function rejectBusinessRequest(requestId, reason) {
  const data = await put(`/business/verification-requests/${requestId}/reject`, {
    reason
  }, false, true);
  return data;
}

// ============================================================================
// INDIVIDUAL VERIFICATION
// ============================================================================

/**
 * Get individual verification status
 */
export async function getIndividualVerificationStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/verification/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    return null;
  }
}

/**
 * Submit individual verification
 */
export async function submitIndividualVerification(formData) {
  const data = await post('/verification/individual', formData, true);
  return data;
}

/**
 * Get individual verification requests (Editor)
 */
export async function getIndividualRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const data = await get(`/admin/individual-verifications${params ? `?${params}` : ''}`, false, true);
  return data;
}

/**
 * Approve individual verification request (Editor)
 */
export async function approveIndividualRequest(requestId) {
  const data = await post(`/admin/individual-verifications/${requestId}/approve`, {}, false, true);
  return data;
}

/**
 * Reject individual verification request (Editor)
 */
export async function rejectIndividualRequest(requestId, reason) {
  const data = await post(`/admin/individual-verifications/${requestId}/reject`, {
    reason
  }, false, true);
  return data;
}

// Default export
export default {
  // Business verification
  getBusinessVerificationStatus,
  submitBusinessVerification,
  getBusinessRequests,
  approveBusinessRequest,
  rejectBusinessRequest,

  // Individual verification
  getIndividualVerificationStatus,
  submitIndividualVerification,
  getIndividualRequests,
  approveIndividualRequest,
  rejectIndividualRequest
};
