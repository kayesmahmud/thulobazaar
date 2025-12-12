/**
 * Auth Methods
 */

import type { AxiosInstance } from 'axios';
import type {
  User,
  ApiResponse,
  LoginFormData,
  RegisterFormData,
} from '@thulobazaar/types';

export function createAuthMethods(client: AxiosInstance) {
  return {
    async login(data: LoginFormData): Promise<ApiResponse<{ user: User; token: string }>> {
      const response = await client.post('/api/auth/login', data);
      return response.data;
    },

    async register(data: RegisterFormData): Promise<ApiResponse<{ user: User; token: string }>> {
      const response = await client.post('/api/auth/register', data);
      return response.data;
    },

    async logout(): Promise<ApiResponse<void>> {
      const response = await client.post('/api/auth/logout');
      return response.data;
    },

    async getMe(): Promise<ApiResponse<User>> {
      const response = await client.get('/api/profile');
      return response.data;
    },
  };
}
