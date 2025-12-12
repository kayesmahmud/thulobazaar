/**
 * API Client Types
 */

export interface ApiClientConfig {
  baseURL: string;
  getAuthToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}
