'use client';

import { useState, useCallback } from 'react';
import type { PaymentGateway } from '@/lib/paymentGateways/types';

export type VerificationType = 'individual' | 'business';
export type FormStep = 'form' | 'payment';

export interface UseVerificationFormOptions {
  type: VerificationType;
  durationDays: number;
  price: number;
  isFreeVerification: boolean;
  isResubmission?: boolean;
  onSuccess: () => void;
}

export interface UseVerificationFormReturn<T> {
  // Form state
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;

  // UI state
  loading: boolean;
  error: string | null;
  step: FormStep;
  selectedPaymentMethod: PaymentGateway | null;

  // Actions
  setError: (error: string | null) => void;
  setStep: (step: FormStep) => void;
  setSelectedPaymentMethod: (method: PaymentGateway | null) => void;
  handleProceedToPayment: (validateForm: () => boolean) => void;
  handleBackToForm: () => void;

  // Submission helpers
  submitFreeVerification: (submitData: FormData, endpoint: string) => Promise<void>;
  submitPaidVerification: (
    submitData: FormData,
    endpoint: string,
    paymentType: string,
    orderName: string,
    metadata: Record<string, unknown>
  ) => Promise<void>;
}

export function useVerificationForm<T>(
  initialFormData: T,
  options: UseVerificationFormOptions
): UseVerificationFormReturn<T> {
  const { type, durationDays, price, isFreeVerification, onSuccess } = options;

  // Form data state
  const [formData, setFormData] = useState<T>(initialFormData);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<FormStep>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway | null>(null);

  // Handle proceed to payment step
  const handleProceedToPayment = useCallback((validateForm: () => boolean) => {
    if (!validateForm()) return;
    setStep('payment');
    setError(null);
  }, []);

  // Handle back to form step
  const handleBackToForm = useCallback(() => {
    setStep('form');
    setSelectedPaymentMethod(null);
    setError(null);
  }, []);

  // Submit free verification
  const submitFreeVerification = useCallback(async (
    submitData: FormData,
    endpoint: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Generate mock transaction ID for free verification
      const prefix = type === 'individual' ? 'FREE_IND' : 'FREE_BIZ';
      const mockTransactionId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Add free verification fields
      submitData.append('payment_reference', mockTransactionId);
      submitData.append('payment_amount', '0');
      submitData.append('payment_status', 'free');
      submitData.append('duration_days', durationDays.toString());

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: submitData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit verification');
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Verification submission error:', err);
      const errorMessage = (err as Error)?.message || 'Failed to submit verification request';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [type, durationDays, onSuccess]);

  // Submit paid verification
  const submitPaidVerification = useCallback(async (
    submitData: FormData,
    endpoint: string,
    paymentType: string,
    orderName: string,
    metadata: Record<string, unknown>
  ) => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add payment fields
      submitData.append('payment_reference', 'PENDING');
      submitData.append('payment_amount', price.toString());
      submitData.append('payment_status', 'pending');
      submitData.append('duration_days', durationDays.toString());

      // Step 1: Submit verification form
      const verificationResponse = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: submitData,
      });

      const verificationData = await verificationResponse.json();

      if (!verificationData.success) {
        throw new Error(verificationData.message || 'Failed to submit verification');
      }

      const verificationRequestId = verificationData.data.requestId;
      console.log(`✅ ${type} verification submitted with ID:`, verificationRequestId);

      // Step 2: Initiate payment
      const paymentResponse = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gateway: selectedPaymentMethod,
          amount: price,
          paymentType,
          relatedId: verificationRequestId,
          orderName,
          metadata: {
            ...metadata,
            durationDays,
            verificationRequestId,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.data?.paymentUrl) {
        window.location.href = paymentData.data.paymentUrl;
      } else {
        throw new Error(paymentData.message || 'Payment initiation failed');
      }
    } catch (err: unknown) {
      console.error('Payment initiation error:', err);
      setError((err as Error)?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  }, [type, durationDays, price, selectedPaymentMethod]);

  return {
    formData,
    setFormData,
    loading,
    error,
    step,
    selectedPaymentMethod,
    setError,
    setStep,
    setSelectedPaymentMethod,
    handleProceedToPayment,
    handleBackToForm,
    submitFreeVerification,
    submitPaidVerification,
  };
}
