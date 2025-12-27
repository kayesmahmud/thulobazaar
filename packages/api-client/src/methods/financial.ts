/**
 * Financial Tracking Methods
 */

import type { AxiosInstance } from 'axios';
import type { ApiResponse } from '@thulobazaar/types';

export function createFinancialMethods(client: AxiosInstance) {
  return {
    async getFinancialStats(params?: {
      period?:
        | 'today'
        | 'yesterday'
        | 'thisweek'
        | 'thismonth'
        | '7days'
        | '30days'
        | '90days'
        | 'all';
      startDate?: string;
      endDate?: string;
    }): Promise<
      ApiResponse<{
        summary: {
          totalRevenue: number;
          totalTransactions: number;
          failedTransactions: {
            count: number;
            amount: number;
          };
          pendingTransactions: {
            count: number;
            amount: number;
          };
        };
        revenueByGateway: Array<{
          gateway: string;
          revenue: number;
          transactions: number;
        }>;
        revenueByType: Array<{
          type: string;
          revenue: number;
          transactions: number;
        }>;
        promotionStats: Array<{
          promotionType: string;
          totalPromotions: number;
          totalRevenue: number;
          activePromotions: number;
        }>;
        dailyRevenue: Array<{
          date: string;
          revenue: number;
          transactions: number;
        }>;
        topCustomers: Array<{
          id: number;
          fullName: string;
          email: string;
          totalSpent: number;
          transactions: number;
        }>;
      }>
    > {
      const response = await client.get('/api/editor/financial/stats', { params });
      return response.data;
    },

    async getFinancialTransactions(params?: {
      page?: number;
      limit?: number;
      status?: string;
      gateway?: string;
      type?: string;
    }): Promise<
      ApiResponse<{
        transactions: Array<any>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    > {
      const response = await client.get('/api/editor/financial/transactions', { params });
      return response.data;
    },

    // Promotion Pricing Methods
    async getAllPromotionPricing(): Promise<ApiResponse<Array<any>>> {
      const response = await client.get('/api/promotion-pricing/admin/all');
      return response.data;
    },

    async updatePromotionPricing(
      id: number,
      data: {
        price: number;
        discount_percentage?: number;
        is_active?: boolean;
      }
    ): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/promotion-pricing/${id}`, data);
      return response.data;
    },

    async createPromotionPricing(data: {
      promotion_type: string;
      duration_days: number;
      account_type: string;
      pricing_tier?: string;
      price: number;
      discount_percentage?: number;
    }): Promise<ApiResponse<any>> {
      const response = await client.post('/api/promotion-pricing', data);
      return response.data;
    },

    async deletePromotionPricing(id: number): Promise<ApiResponse<any>> {
      const response = await client.delete(`/api/promotion-pricing/${id}`);
      return response.data;
    },
  };
}
