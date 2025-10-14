/**
 * Promotion API
 *
 * Handles all promotion pricing and payment operations
 */

import { API_BASE_URL } from '../config/env.js';
import { get, post, put } from './client.js';

// ============================================================================
// PROMOTION PRICING
// ============================================================================

/**
 * Get promotion pricing (public)
 */
export async function getPromotionPricing() {
  try {
    const response = await fetch(`${API_BASE_URL}/promotion-pricing`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch promotion pricing');
    }

    return data.data;
  } catch (error) {
    console.error('❌ Get promotion pricing error:', error);
    throw error;
  }
}

/**
 * Calculate promotion price
 */
export async function calculatePromotionPrice(promotionType, durationDays, adId) {
  try {
    const data = await get(
      `/promotion-pricing/calculate?promotionType=${promotionType}&durationDays=${durationDays}${adId ? `&adId=${adId}` : ''}`,
      true
    );
    return data.data;
  } catch (error) {
    console.error('❌ Calculate promotion price error:', error);
    throw error;
  }
}

/**
 * Get all promotion pricing (Admin)
 */
export async function getAllPromotionPricing() {
  const data = await get('/promotion-pricing/admin/all', false, true);
  return data.data;
}

/**
 * Update promotion price (Admin)
 */
export async function updatePromotionPrice(pricingId, newPrice, newDiscount) {
  const data = await put(`/promotion-pricing/${pricingId}`, {
    price: newPrice,
    discount_percentage: newDiscount
  }, false, true);
  return data.data;
}

// ============================================================================
// PAYMENT
// ============================================================================

/**
 * Initiate payment
 */
export async function initiatePayment(promotionData) {
  const data = await post('/mock-payment/initiate', promotionData, true);
  return data;
}

/**
 * Verify payment
 */
export async function verifyPayment(transactionId) {
  const data = await post('/mock-payment/verify', { transactionId }, true);
  return data;
}

/**
 * Get payment status
 */
export async function getPaymentStatus(transactionId) {
  try {
    const data = await get(`/mock-payment/status/${transactionId}`, true);
    return data.data;
  } catch (error) {
    console.error('❌ Get payment status error:', error);
    throw error;
  }
}

// Default export
export default {
  // Promotion pricing
  getPromotionPricing,
  calculatePromotionPrice,
  getAllPromotionPricing,
  updatePromotionPrice,

  // Payment
  initiatePayment,
  verifyPayment,
  getPaymentStatus
};
