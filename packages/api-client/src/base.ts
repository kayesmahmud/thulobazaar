/**
 * Base API Client with Axios Setup
 */

import axios, { AxiosInstance } from 'axios';
import type { ApiClientConfig } from './types';

export class BaseApiClient {
  protected client: AxiosInstance;
  protected config: ApiClientConfig;

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
}
