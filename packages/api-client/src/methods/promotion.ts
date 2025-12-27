/**
 * Promotion & Payment Methods
 */

import type { AxiosInstance } from 'axios';
import type { PromotionPlan, PaymentTransaction, ApiResponse } from '@thulobazaar/types';

export function createPromotionMethods(client: AxiosInstance) {
  return {
    async getPromotionPlans(): Promise<ApiResponse<PromotionPlan[]>> {
      const response = await client.get('/api/promotions/plans');
      return response.data;
    },

    async createPayment(data: {
      ad_id: number;
      promotion_plan_id: number;
      payment_method: 'esewa' | 'khalti' | 'card';
    }): Promise<ApiResponse<PaymentTransaction>> {
      const response = await client.post('/api/payments', data);
      return response.data;
    },

    async verifyPayment(transactionId: string): Promise<ApiResponse<PaymentTransaction>> {
      const response = await client.post('/api/payments/verify', {
        transaction_id: transactionId,
      });
      return response.data;
    },

    // New Promotion System (with pricing tiers)
    async getPromotionPricing(params?: { adId?: number; tier?: string }): Promise<
      ApiResponse<{
        pricing: {
          [promotionType: string]: {
            [duration: number]: {
              individual: { price: number; discount_percentage: number };
              individual_verified: { price: number; discount_percentage: number };
              business: { price: number; discount_percentage: number };
            };
          };
        };
        pricingByTier: Record<
          string,
          {
            [promotionType: string]: {
              [duration: number]: {
                individual: { price: number; discount_percentage: number };
                individual_verified: { price: number; discount_percentage: number };
                business: { price: number; discount_percentage: number };
              };
            };
          }
        >;
        adPricing?: {
          [promotionType: string]: {
            [duration: number]: {
              individual: { price: number; discount_percentage: number };
              individual_verified: { price: number; discount_percentage: number };
              business: { price: number; discount_percentage: number };
            };
          };
        };
        adPricingTier?: string;
        tiers: string[];
        raw: any[];
      }>
    > {
      const response = await client.get('/api/promotion-pricing', { params });
      return response.data;
    },

    async calculatePromotionPrice(params: {
      promotionType: string;
      durationDays: number;
      adId?: number;
    }): Promise<
      ApiResponse<{
        promotionType: string;
        durationDays: number;
        accountType: string;
        price: number;
        discountPercentage: number;
        currency: string;
      }>
    > {
      const response = await client.get('/api/promotion-pricing/calculate', { params });
      return response.data;
    },

    async initiatePayment(data: {
      amount: number;
      paymentType: string;
      relatedId?: number;
      metadata?: {
        adId: number;
        promotionType: string;
        durationDays: number;
      };
    }): Promise<
      ApiResponse<{
        paymentTransactionId: number;
        transactionId: string;
        paymentUrl: string;
        amount: number;
        productName: string;
        gateway: string;
        message: string;
      }>
    > {
      const response = await client.post('/api/mock-payment/initiate', data);
      return response.data;
    },

    async verifyMockPayment(
      transactionId: string,
      amount: number
    ): Promise<
      ApiResponse<{
        transactionId: string;
        amount: number;
        status: string;
        verifiedAt: string;
        promotionActivated: boolean;
      }>
    > {
      const response = await client.post('/api/mock-payment/verify', {
        transactionId,
        amount,
      });
      return response.data;
    },

    async getPaymentStatus(transactionId: string): Promise<
      ApiResponse<{
        payment: {
          id: number;
          transactionId: string;
          paymentType: string;
          amount: number;
          status: string;
          createdAt: string;
          verifiedAt: string | null;
          metadata: any;
        };
      }>
    > {
      const response = await client.get(`/api/mock-payment/status/${transactionId}`);
      return response.data;
    },
  };
}
