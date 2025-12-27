/**
 * Verifications API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type {
  ApiResponse,
  Verification,
  VerificationStatus,
  VerificationType,
  VerificationAction,
} from './types';

/**
 * Get verifications with optional filters
 * Uses Next.js API routes (relative URL) instead of Express backend
 */
export async function getVerifications(
  status: VerificationStatus = 'pending',
  type: VerificationType = 'all',
  token?: string
): Promise<ApiResponse<Verification[]>> {
  const queryString = buildQueryString({ status, type });
  return apiRequest<ApiResponse<Verification[]>>(`/api/admin/verifications${queryString}`, {
    token,
    useRelativeUrl: true,
  });
}

/**
 * Get all pending verifications (legacy function for backwards compatibility)
 */
export async function getPendingVerifications(token?: string): Promise<ApiResponse<Verification[]>> {
  return getVerifications('pending', 'all', token);
}

/**
 * Generic verification action handler
 * Consolidates approve/reject logic for both business and individual verifications
 */
export async function handleVerificationAction(
  type: 'business' | 'individual',
  verificationId: number,
  action: VerificationAction,
  reason?: string,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(
    `/api/admin/verifications/${type}/${verificationId}/${action}`,
    {
      method: 'POST',
      body: action === 'reject' ? { reason } : undefined,
      token,
      useRelativeUrl: true,
    }
  );
}

// ============================================
// Backwards-compatible wrapper functions
// ============================================

export const approveBusinessVerification = (verificationId: number, token?: string) =>
  handleVerificationAction('business', verificationId, 'approve', undefined, token);

export const rejectBusinessVerification = (verificationId: number, reason: string, token?: string) =>
  handleVerificationAction('business', verificationId, 'reject', reason, token);

export const approveIndividualVerification = (verificationId: number, token?: string) =>
  handleVerificationAction('individual', verificationId, 'approve', undefined, token);

export const rejectIndividualVerification = (verificationId: number, reason: string, token?: string) =>
  handleVerificationAction('individual', verificationId, 'reject', reason, token);

// Legacy wrapper functions
export const reviewBusinessVerification = (
  verificationId: number,
  action: VerificationAction,
  reason?: string,
  token?: string
) => handleVerificationAction('business', verificationId, action, reason, token);

export const reviewIndividualVerification = (
  verificationId: number,
  action: VerificationAction,
  reason?: string,
  token?: string
) => handleVerificationAction('individual', verificationId, action, reason, token);
