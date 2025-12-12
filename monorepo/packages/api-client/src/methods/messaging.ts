/**
 * Messaging Methods
 */

import type { AxiosInstance } from 'axios';
import type { Message, Conversation, ApiResponse } from '@thulobazaar/types';

export function createMessagingMethods(client: AxiosInstance) {
  return {
    async sendMessage(data: {
      recipient_id: number;
      ad_id?: number;
      message: string;
    }): Promise<ApiResponse<void>> {
      const response = await client.post('/api/messages', data);
      return response.data;
    },

    async getConversations(): Promise<ApiResponse<Conversation[]>> {
      const response = await client.get('/api/messages/conversations');
      return response.data;
    },

    async getMessages(conversationId: number): Promise<ApiResponse<Message[]>> {
      const response = await client.get(`/api/messages/${conversationId}`);
      return response.data;
    },

    async getContactMessages(type: 'sent' | 'received'): Promise<ApiResponse<Message[]>> {
      const response = await client.get(`/api/contact-messages/${type}`);
      return response.data;
    },
  };
}
