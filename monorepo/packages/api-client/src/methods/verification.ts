/**
 * Verification Methods
 */

import type { AxiosInstance } from 'axios';
import type {
  BusinessVerificationRequest,
  IndividualVerificationRequest,
  ApiResponse,
  VerificationStatusResponse,
} from '@thulobazaar/types';

export function createVerificationMethods(client: AxiosInstance) {
  return {
    async submitBusinessVerification(
      data: Partial<BusinessVerificationRequest> | FormData
    ): Promise<ApiResponse<BusinessVerificationRequest>> {
      const response = await client.post('/api/verification/business', data);
      return response.data;
    },

    async submitIndividualVerification(
      data: Partial<IndividualVerificationRequest> | FormData
    ): Promise<ApiResponse<IndividualVerificationRequest>> {
      const response = await client.post('/api/verification/individual', data);
      return response.data;
    },

    async getVerificationStatus(): Promise<ApiResponse<VerificationStatusResponse>> {
      const response = await client.get('/api/verification/status');
      return response.data;
    },

    async getBusinessVerificationStatus(): Promise<ApiResponse<BusinessVerificationRequest>> {
      const response = await client.get('/api/business-verification/status');
      return response.data;
    },

    async getIndividualVerificationStatus(): Promise<ApiResponse<IndividualVerificationRequest>> {
      const response = await client.get('/api/individual-verification/status');
      return response.data;
    },
  };
}
