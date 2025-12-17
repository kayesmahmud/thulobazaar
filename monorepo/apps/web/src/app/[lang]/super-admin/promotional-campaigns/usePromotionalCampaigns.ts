'use client';

import { useState, useCallback } from 'react';

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  discountPercentage: number;
  promoCode: string | null;
  bannerText: string | null;
  bannerEmoji: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesToTiers: string[];
  appliesToPromotionTypes: string[];
  minDurationDays: number | null;
  maxUses: number | null;
  currentUses: number;
  createdBy: { id: number; fullName: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFormData {
  name: string;
  description: string;
  discountPercentage: number;
  promoCode: string;
  bannerText: string;
  bannerEmoji: string;
  startDate: string;
  endDate: string;
  appliesToTiers: string[];
  appliesToPromotionTypes: string[];
  minDurationDays: number | null;
  maxUses: number | null;
}

export function usePromotionalCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch('/api/super-admin/promotional-campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      } else {
        setError(data.message || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (formData: CampaignFormData) => {
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch('/api/super-admin/promotional-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await loadCampaigns();
        return true;
      } else {
        setError(data.message || 'Failed to create campaign');
        return false;
      }
    } catch (err) {
      setError('Failed to create campaign');
      console.error('Error creating campaign:', err);
      return false;
    }
  }, [loadCampaigns]);

  const updateCampaign = useCallback(async (id: number, formData: Partial<CampaignFormData>) => {
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch(`/api/super-admin/promotional-campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await loadCampaigns();
        return true;
      } else {
        setError(data.message || 'Failed to update campaign');
        return false;
      }
    } catch (err) {
      setError('Failed to update campaign');
      console.error('Error updating campaign:', err);
      return false;
    }
  }, [loadCampaigns]);

  const toggleCampaignActive = useCallback(async (id: number, isActive: boolean) => {
    return updateCampaign(id, { isActive } as any);
  }, [updateCampaign]);

  const deleteCampaign = useCallback(async (id: number) => {
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch(`/api/super-admin/promotional-campaigns/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        await loadCampaigns();
        return true;
      } else {
        setError(data.message || 'Failed to delete campaign');
        return false;
      }
    } catch (err) {
      setError('Failed to delete campaign');
      console.error('Error deleting campaign:', err);
      return false;
    }
  }, [loadCampaigns]);

  // Filter campaigns based on status
  const filteredCampaigns = campaigns.filter((campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    const isCurrentlyActive = campaign.isActive && startDate <= now && endDate >= now;

    if (filter === 'active') return isCurrentlyActive;
    if (filter === 'inactive') return !isCurrentlyActive;
    return true;
  });

  // Stats
  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => {
      const now = new Date();
      return c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
    }).length,
    upcoming: campaigns.filter((c) => {
      const now = new Date();
      return c.isActive && new Date(c.startDate) > now;
    }).length,
    expired: campaigns.filter((c) => {
      const now = new Date();
      return new Date(c.endDate) < now;
    }).length,
  };

  return {
    campaigns,
    filteredCampaigns,
    loading,
    error,
    filter,
    setFilter,
    stats,
    loadCampaigns,
    createCampaign,
    updateCampaign,
    toggleCampaignActive,
    deleteCampaign,
    setError,
  };
}
