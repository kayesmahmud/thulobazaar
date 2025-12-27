'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui';
import type { VerificationStatus, VerificationPricing, PricingOption, VerificationType } from './types';

export function useVerificationPage(lang: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [pricing, setPricing] = useState<VerificationPricing | null>(null);

  // Phone verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // Selection state
  const [selectedType, setSelectedType] = useState<VerificationType | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<PricingOption | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isResubmission, setIsResubmission] = useState(false);
  const [resubmissionDuration, setResubmissionDuration] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, lang]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [verificationResponse, pricingResponse, profileResponse] = await Promise.all([
        apiClient.getVerificationStatus().catch(() => ({ success: false, data: null })),
        fetch('/api/verification/pricing', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }).then(res => res.json()).catch(() => ({ success: false, data: null })),
        fetch('/api/profile', { credentials: 'include' })
          .then(res => res.json())
          .catch(() => ({ success: false, data: null })),
      ]);

      if (verificationResponse.success && verificationResponse.data) {
        // Transform API response to match frontend types
        // API returns: { businessVerification, individualVerification }
        // Frontend expects: { business, individual }
        const apiData = verificationResponse.data as any;
        const transformed: VerificationStatus = {
          business: apiData.businessVerification ? {
            status: apiData.businessVerification.status || 'unverified',
            rejectionReason: apiData.businessVerification.request?.rejectionReason,
            expiresAt: apiData.businessVerification.expiresAt,
            daysRemaining: apiData.businessVerification.daysRemaining,
            isExpiringSoon: apiData.businessVerification.isExpiringSoon,
            request: apiData.businessVerification.request,
          } : undefined,
          individual: apiData.individualVerification ? {
            status: apiData.individualVerification.status || 'unverified',
            rejectionReason: apiData.individualVerification.request?.rejectionReason,
            expiresAt: apiData.individualVerification.expiresAt,
            daysRemaining: apiData.individualVerification.daysRemaining,
            isExpiringSoon: apiData.individualVerification.isExpiringSoon,
            request: apiData.individualVerification.request,
          } : undefined,
        };
        setVerificationStatus(transformed);
      }

      if (pricingResponse.success && pricingResponse.data) {
        setPricing(pricingResponse.data);
      }

      if (profileResponse.success && profileResponse.data) {
        setPhoneVerified(profileResponse.data.phoneVerified || false);
        setUserPhone(profileResponse.data.phone || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: VerificationType) => {
    if (!phoneVerified) {
      showError('Please verify your phone number first before applying for verification.');
      return;
    }

    setSelectedType(type);
    setSelectedDuration(null);
    setShowForm(false);
    setIsResubmission(false);
    setResubmissionDuration(null);

    const verificationData = type === 'business'
      ? verificationStatus?.business
      : verificationStatus?.individual;

    // Check if this is a free resubmission (rejected with already paid)
    // canResubmitFree is true when status is 'rejected' and payment_status is 'paid' or 'free'
    const canResubmitFree = verificationData?.request?.canResubmitFree ||
      (verificationData?.status === 'rejected' &&
        verificationData?.request?.paymentStatus &&
        ['paid', 'free'].includes(verificationData.request.paymentStatus));

    if (canResubmitFree && verificationData?.request?.durationDays) {
      setIsResubmission(true);
      setResubmissionDuration(verificationData.request.durationDays);
      setShowForm(true);
    }
  };

  const handleDurationSelect = (option: PricingOption) => {
    setSelectedDuration(option);
  };

  const handleProceedToForm = () => {
    if (selectedType && selectedDuration) {
      setShowForm(true);
    }
  };

  const handleFormSuccess = async () => {
    success(`${selectedType === 'individual' ? 'Individual' : 'Business'} verification submitted successfully! We will review it shortly.`);
    setShowForm(false);
    setSelectedType(null);
    setSelectedDuration(null);
    await loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleClearSelection = () => {
    setSelectedType(null);
    setSelectedDuration(null);
  };

  // Check if free verification applies
  const isFreeVerification = pricing?.freeVerification.enabled &&
    pricing?.freeVerification.isEligible &&
    selectedType &&
    pricing?.freeVerification.types.includes(selectedType);

  return {
    status,
    loading,
    verificationStatus,
    pricing,
    phoneVerified,
    userPhone,
    selectedType,
    selectedDuration,
    showForm,
    isResubmission,
    resubmissionDuration,
    isFreeVerification,
    handleTypeSelect,
    handleDurationSelect,
    handleProceedToForm,
    handleFormSuccess,
    handleFormCancel,
    handleClearSelection,
  };
}
