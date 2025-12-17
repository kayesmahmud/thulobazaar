'use client';

export interface VerificationCampaign {
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
  appliesToTypes: string[];
  minDurationDays: number | null;
  maxUses: number | null;
}
