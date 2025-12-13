'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { PromotionPricing, EditFormData, AddFormData } from './types';

export function usePromotionPricing() {
  const [pricings, setPricings] = useState<PromotionPricing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPricings = useCallback(async () => {
    try {
      console.log('💰 [Promotion Pricing] Loading all pricing...');
      setLoading(true);

      const response = await apiClient.getAllPromotionPricing();
      console.log('💰 [Promotion Pricing] Response:', response);

      if (response.success && response.data) {
        setPricings(response.data);
      }

      setLoading(false);
      console.log('✅ [Promotion Pricing] Loaded successfully');
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error loading:', error);
      setLoading(false);
    }
  }, []);

  const updatePricing = useCallback(async (id: number, editForm: EditFormData): Promise<boolean> => {
    try {
      console.log('💾 [Promotion Pricing] Updating pricing:', { id, ...editForm });
      const response = await apiClient.updatePromotionPricing(id, editForm);

      if (response.success) {
        console.log('✅ [Promotion Pricing] Updated successfully');
        await loadPricings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error updating:', error);
      alert('Failed to update pricing');
      return false;
    }
  }, [loadPricings]);

  const toggleActive = useCallback(async (pricing: PromotionPricing): Promise<boolean> => {
    try {
      const newStatus = !pricing.is_active;
      console.log(`🔄 [Promotion Pricing] ${newStatus ? 'Activating' : 'Deactivating'} pricing:`, pricing.id);

      const response = await apiClient.updatePromotionPricing(pricing.id, {
        price: pricing.price,
        discount_percentage: pricing.discount_percentage,
        is_active: newStatus,
      });

      if (response.success) {
        console.log('✅ [Promotion Pricing] Status updated');
        await loadPricings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error toggling status:', error);
      alert('Failed to update status');
      return false;
    }
  }, [loadPricings]);

  const createPricing = useCallback(async (addForm: AddFormData): Promise<boolean> => {
    try {
      console.log('➕ [Promotion Pricing] Creating new pricing:', addForm);
      const response = await apiClient.createPromotionPricing(addForm);

      if (response.success) {
        console.log('✅ [Promotion Pricing] Created successfully');
        await loadPricings();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ [Promotion Pricing] Error creating:', error);
      if (error.response?.status === 409) {
        alert('Pricing for this combination already exists');
      } else {
        alert('Failed to create pricing');
      }
      return false;
    }
  }, [loadPricings]);

  const deletePricing = useCallback(async (id: number): Promise<boolean> => {
    if (!confirm('Are you sure you want to deactivate this pricing?')) return false;

    try {
      console.log('🗑️ [Promotion Pricing] Deactivating pricing:', id);
      const response = await apiClient.deletePromotionPricing(id);

      if (response.success) {
        console.log('✅ [Promotion Pricing] Deactivated successfully');
        await loadPricings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [Promotion Pricing] Error deactivating:', error);
      alert('Failed to deactivate pricing');
      return false;
    }
  }, [loadPricings]);

  // Group pricings by promotion type
  const groupedPricings = pricings.reduce((acc, pricing) => {
    if (!acc[pricing.promotion_type]) {
      acc[pricing.promotion_type] = [];
    }
    acc[pricing.promotion_type]!.push(pricing);
    return acc;
  }, {} as Record<string, PromotionPricing[]>);

  return {
    pricings,
    loading,
    groupedPricings,
    loadPricings,
    updatePricing,
    toggleActive,
    createPricing,
    deletePricing,
  };
}
