/**
 * useMessagingApi Hook
 * Provides access to the messaging API instance
 */

import { useMemo } from 'react';
import { MessagingApi, MessagingApiConfig } from '../services/messagingApi';

/**
 * Hook to create and access messaging API instance
 *
 * @example
 * const api = useMessagingApi({
 *   backendUrl: 'http://localhost:5000',
 *   getAuthToken: () => localStorage.getItem('token'),
 * });
 *
 * const conversations = await api.getConversations();
 */
export function useMessagingApi(config: MessagingApiConfig): MessagingApi {
  return useMemo(() => new MessagingApi(config), [config.backendUrl, config.getAuthToken]);
}
