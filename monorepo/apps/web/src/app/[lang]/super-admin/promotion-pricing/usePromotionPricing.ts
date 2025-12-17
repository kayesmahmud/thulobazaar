'use client';

import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import type { PromotionPricing, EditFormData, AddFormData, PricingTier } from './types';
import { PRICING_TIERS } from './types';

export function usePromotionPricing() {
  const [pricings, setPricings] = useState<PromotionPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<PricingTier>('default');

  const loadPricings = useCallback(async () => {
    try {
      console.log('💰 [Promotion Pricing] Loading all pricing...');
      setLoading(true);

      const response = await apiClient.getAllPromotionPricing();
      console.log('💰 [Promotion Pricing] Response:', response);

      if (response.success && response.data) {
        // Transform raw data to include pricing_tier
        const responseData = response.data as { raw?: unknown[] };
        const rawData = responseData.raw || responseData;
        const transformedData = Array.isArray(rawData) ? rawData.map((p: Record<string, unknown>) => ({
          id: p.id as number,
          promotion_type: (p.promotionType || p.promotion_type) as string,
          duration_days: (p.durationDays || p.duration_days) as number,
          account_type: (p.accountType || p.account_type) as string,
          pricing_tier: (p.pricingTier || p.pricing_tier || 'default') as string,
          price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price as number),
          discount_percentage: (p.discountPercentage || p.discount_percentage || 0) as number,
          is_active: (p.isActive ?? p.is_active ?? true) as boolean,
          created_at: (p.createdAt || p.created_at || '') as string,
          updated_at: (p.updatedAt || p.updated_at || '') as string,
        })) : [];
        setPricings(transformedData);
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
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      console.error('❌ [Promotion Pricing] Error creating:', error);
      if (err.response?.status === 409) {
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

  // Filter pricings by selected tier
  const filteredPricings = useMemo(() => {
    return pricings.filter(p => p.pricing_tier === selectedTier);
  }, [pricings, selectedTier]);

  // Group filtered pricings by promotion type
  const groupedPricings = useMemo(() => {
    return filteredPricings.reduce((acc, pricing) => {
      if (!acc[pricing.promotion_type]) {
        acc[pricing.promotion_type] = [];
      }
      acc[pricing.promotion_type]!.push(pricing);
      return acc;
    }, {} as Record<string, PromotionPricing[]>);
  }, [filteredPricings]);

  // Count pricings per tier
  const tierCounts = useMemo(() => {
    return PRICING_TIERS.reduce((acc, tier) => {
      acc[tier] = pricings.filter(p => p.pricing_tier === tier).length;
      return acc;
    }, {} as Record<string, number>);
  }, [pricings]);

  return {
    pricings,
    filteredPricings,
    loading,
    selectedTier,
    setSelectedTier,
    groupedPricings,
    tierCounts,
    loadPricings,
    updatePricing,
    toggleActive,
    createPricing,
    deletePricing,
  };
}
