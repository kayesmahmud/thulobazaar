'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CategoryTierMapping, Category, PricingTier } from './types';
import { PRICING_TIERS } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export function useCategoryPricingTiers() {
  const [mappings, setMappings] = useState<CategoryTierMapping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadMappings = useCallback(async () => {
    try {
      console.log('🏷️ [Category Tiers] Loading mappings...');
      setLoading(true);

      const token = localStorage.getItem('editorToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/category-pricing-tiers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('🏷️ [Category Tiers] Response:', data);

      if (data.success && data.data) {
        setMappings(data.data.mappings || []);
        setCategories(data.data.categories || []);
      }

      setLoading(false);
      console.log('✅ [Category Tiers] Loaded successfully');
    } catch (error) {
      console.error('❌ [Category Tiers] Error loading:', error);
      setLoading(false);
    }
  }, []);

  const updateTier = useCallback(async (categoryName: string, categoryId: number | null, tier: PricingTier): Promise<boolean> => {
    try {
      console.log('💾 [Category Tiers] Updating tier:', { categoryName, categoryId, tier });
      setSaving(true);

      const token = localStorage.getItem('editorToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/category-pricing-tiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_name: categoryName,
          category_id: categoryId,
          pricing_tier: tier,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ [Category Tiers] Updated successfully');
        await loadMappings();
        setSaving(false);
        return true;
      }

      setSaving(false);
      return false;
    } catch (error) {
      console.error('❌ [Category Tiers] Error updating:', error);
      setSaving(false);
      alert('Failed to update tier');
      return false;
    }
  }, [loadMappings]);

  const removeTier = useCallback(async (categoryName: string): Promise<boolean> => {
    if (!confirm(`Remove tier assignment for "${categoryName}"? It will use default pricing.`)) {
      return false;
    }

    try {
      console.log('🗑️ [Category Tiers] Removing tier:', categoryName);
      setSaving(true);

      const token = localStorage.getItem('editorToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/category-pricing-tiers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category_name: categoryName }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ [Category Tiers] Removed successfully');
        await loadMappings();
        setSaving(false);
        return true;
      }

      setSaving(false);
      return false;
    } catch (error) {
      console.error('❌ [Category Tiers] Error removing:', error);
      setSaving(false);
      alert('Failed to remove tier');
      return false;
    }
  }, [loadMappings]);

  // Get tier for a category (from mappings or default)
  const getTierForCategory = useCallback((categoryName: string): PricingTier => {
    const mapping = mappings.find(m => m.categoryName === categoryName);
    return (mapping?.pricingTier as PricingTier) || 'default';
  }, [mappings]);

  // Group categories by their assigned tier
  const categoriesByTier = useMemo(() => {
    const result: Record<PricingTier, Category[]> = {
      default: [],
      electronics: [],
      vehicles: [],
      property: [],
    };

    categories.forEach(cat => {
      const tier = getTierForCategory(cat.name);
      result[tier].push(cat);
    });

    return result;
  }, [categories, getTierForCategory]);

  // Count categories per tier
  const tierCounts = useMemo(() => {
    return PRICING_TIERS.reduce((acc, tier) => {
      acc[tier] = categoriesByTier[tier].length;
      return acc;
    }, {} as Record<PricingTier, number>);
  }, [categoriesByTier]);

  return {
    mappings,
    categories,
    loading,
    saving,
    loadMappings,
    updateTier,
    removeTier,
    getTierForCategory,
    categoriesByTier,
    tierCounts,
  };
}
