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
  appliesToTypes: string[];
  minDurationDays: number | null;
  maxUses: number | null;
  currentUses: number;
  createdAt: string;
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
  appliesToTypes: string[];
  minDurationDays: number | null;
  maxUses: number | null;
}

export function useVerificationCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch('/api/super-admin/verification-campaigns', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      } else {
        setError(data.message || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('Failed to load campaigns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (formData: CampaignFormData) => {
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch('/api/super-admin/verification-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        await loadCampaigns();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Failed to create campaign' };
    }
  }, [loadCampaigns]);

  const deleteCampaign = useCallback(async (id: number) => {
    try {
      const token = localStorage.getItem('editorToken');
      const response = await fetch(`/api/super-admin/verification-campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        await loadCampaigns();
        return true;
      }
      setError(data.message);
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [loadCampaigns]);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => {
      const now = new Date();
      return c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now;
    }).length,
    upcoming: campaigns.filter((c) => c.isActive && new Date(c.startDate) > new Date()).length,
    expired: campaigns.filter((c) => new Date(c.endDate) < new Date()).length,
  };

  return { campaigns, loading, error, stats, loadCampaigns, createCampaign, deleteCampaign, setError };
}
