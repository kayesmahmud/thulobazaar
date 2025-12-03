'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import type { PaymentGateway } from '@/lib/paymentGateways/types';

interface FormData {
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  businessWebsite: string;
  businessPhone: string;
  businessAddress: string;
  licenseFile: File | null;
}

interface BusinessVerificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  durationDays: number;
  price: number;
  isFreeVerification: boolean;
}

export default function BusinessVerificationForm({
  onSuccess,
  onCancel,
  durationDays,
  price,
  isFreeVerification,
}: BusinessVerificationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessCategory: '',
    businessDescription: '',
    businessWebsite: '',
    businessPhone: '',
    businessAddress: '',
    licenseFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway | null>(null);

  // Handle text input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle file input changes with preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: file }));
      setError(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  };

  // Clear file selection
  const clearFile = () => {
    setFormData((prev) => ({ ...prev, licenseFile: null }));
    setImagePreview(null);
  };

  // Get duration label
  const getDurationLabel = () => {
    if (durationDays === 30) return '1 Month';
    if (durationDays === 90) return '3 Months';
    if (durationDays === 180) return '6 Months';
    if (durationDays === 365) return '1 Year';
    return `${durationDays} Days`;
  };

  // Validate form before proceeding
  const validateForm = (): boolean => {
    if (!formData.businessName.trim()) {
      setError('Please enter your business name');
      return false;
    }

    if (!formData.licenseFile) {
      setError('Please upload your business license document');
      return false;
    }

    return true;
  };

  // Handle proceed to payment
  const handleProceedToPayment = () => {
    if (!validateForm()) return;
    setStep('payment');
    setError(null);
  };

  // Handle back to form
  const handleBackToForm = () => {
    setStep('form');
    setSelectedPaymentMethod(null);
    setError(null);
  };

  // Handle free verification submission
  const handleFreeSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Generate transaction ID for free verification
      const freeTransactionId = `FREE_BIZ_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      console.log('🎁 Free verification:', freeTransactionId);

      // Submit verification with free payment reference
      const submitData = new FormData();
      submitData.append('business_name', formData.businessName.trim());
      submitData.append('business_license_document', formData.licenseFile!);
      submitData.append('payment_reference', freeTransactionId);
      submitData.append('payment_amount', '0');
      submitData.append('duration_days', durationDays.toString());
      submitData.append('payment_status', 'free');

      if (formData.businessCategory.trim()) {
        submitData.append('business_category', formData.businessCategory.trim());
      }

      if (formData.businessDescription.trim()) {
        submitData.append('business_description', formData.businessDescription.trim());
      }

      if (formData.businessWebsite.trim()) {
        submitData.append('business_website', formData.businessWebsite.trim());
      }

      if (formData.businessPhone.trim()) {
        submitData.append('business_phone', formData.businessPhone.trim());
      }

      if (formData.businessAddress.trim()) {
        submitData.append('business_address', formData.businessAddress.trim());
      }

      console.log('📤 Submitting business verification...');

      // Submit via API client
      await apiClient.submitBusinessVerification(submitData);

      console.log('✅ Business verification submitted successfully!');

      // Success!
      onSuccess();
    } catch (err: unknown) {
      console.error('❌ Business verification submission error:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err as Error)?.message
        || 'Failed to submit verification request';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle paid verification with real payment gateway
  // Flow: Submit form (with pending_payment status) -> Get verification ID -> Initiate payment
  const handlePaidSubmit = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Step 1: Submit verification form with file to get verification request ID
      // This creates a record with status 'pending_payment'
      const submitData = new FormData();
      submitData.append('business_name', formData.businessName.trim());
      submitData.append('business_license_document', formData.licenseFile!);
      submitData.append('payment_reference', 'PENDING'); // Will be updated after payment
      submitData.append('payment_amount', price.toString());
      submitData.append('duration_days', durationDays.toString());
      submitData.append('payment_status', 'pending'); // Not free, not paid yet

      if (formData.businessCategory.trim()) {
        submitData.append('business_category', formData.businessCategory.trim());
      }
      if (formData.businessDescription.trim()) {
        submitData.append('business_description', formData.businessDescription.trim());
      }
      if (formData.businessWebsite.trim()) {
        submitData.append('business_website', formData.businessWebsite.trim());
      }
      if (formData.businessPhone.trim()) {
        submitData.append('business_phone', formData.businessPhone.trim());
      }
      if (formData.businessAddress.trim()) {
        submitData.append('business_address', formData.businessAddress.trim());
      }

      const verificationResponse = await fetch('/api/verification/business', {
        method: 'POST',
        credentials: 'include',
        body: submitData,
      });

      const verificationData = await verificationResponse.json();

      if (!verificationData.success) {
        throw new Error(verificationData.message || 'Failed to submit verification');
      }

      const verificationRequestId = verificationData.data.requestId;
      console.log('✅ Business verification submitted with ID:', verificationRequestId, 'Status:', verificationData.data.status);

      // Step 2: Initiate payment with verification request ID as relatedId
      const paymentResponse = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gateway: selectedPaymentMethod,
          amount: price,
          paymentType: 'business_verification',
          relatedId: verificationRequestId, // Link payment to verification request
          orderName: `Business Verification - ${getDurationLabel()}`,
          metadata: {
            durationDays,
            businessName: formData.businessName.trim(),
            verificationRequestId,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.data?.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = paymentData.data.paymentUrl;
      } else {
        throw new Error(paymentData.message || 'Payment initiation failed');
      }
    } catch (err: unknown) {
      console.error('Payment initiation error:', err);
      setError((err as Error)?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  // Handle form submission based on whether it's free or paid
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFreeVerification) {
      await handleFreeSubmit();
    } else {
      handleProceedToPayment();
    }
  };

  // Check if we're in development/sandbox mode
  const isDevelopment = process.env.NODE_ENV === 'development' ||
    typeof window !== 'undefined' && window.location.hostname === 'localhost';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white p-4 sm:p-6 rounded-t-xl z-10">
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 'form' ? 'Business Verification' : 'Complete Payment'}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {getDurationLabel()} Plan
              </p>
            </div>
            <button
              onClick={onCancel}
              type="button"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ml-2 flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator (only for paid verifications) */}
          {!isFreeVerification && (
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex items-center gap-1.5 ${step === 'form' ? 'opacity-100' : 'opacity-60'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 'form' ? 'bg-white text-rose-600' : 'bg-white/30 text-white'
                }`}>1</span>
                <span className="text-sm hidden sm:inline">Fill Details</span>
              </div>
              <div className="w-8 h-0.5 bg-white/30" />
              <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'opacity-100' : 'opacity-60'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 'payment' ? 'bg-white text-rose-600' : 'bg-white/30 text-white'
                }`}>2</span>
                <span className="text-sm hidden sm:inline">Payment</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit}>
              {/* Plan Summary */}
              <div className={`rounded-lg p-4 mb-6 ${
                isFreeVerification
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                  : 'bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{isFreeVerification ? '🎁' : '🏢'}</span>
                    <div>
                      <div className="font-bold text-gray-900">
                        {getDurationLabel()} Business Verification
                      </div>
                      <div className="text-sm text-gray-600">
                        {isFreeVerification
                          ? 'Free promotional offer for new users'
                          : 'Get verified business badge'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold ${isFreeVerification ? 'text-green-600' : 'text-rose-600'}`}>
                    {isFreeVerification ? 'FREE' : `NPR ${price.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Business Name */}
              <div className="mb-5">
                <label
                  htmlFor="businessName"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Business Name *
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your registered business name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Business Category */}
              <div className="mb-5">
                <label
                  htmlFor="businessCategory"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Business Category
                </label>
                <input
                  type="text"
                  id="businessCategory"
                  name="businessCategory"
                  value={formData.businessCategory}
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics, Clothing, Food & Beverage"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Business Description */}
              <div className="mb-5">
                <label
                  htmlFor="businessDescription"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Business Description
                </label>
                <textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description of your business"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Business Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label
                    htmlFor="businessPhone"
                    className="block mb-2 font-semibold text-gray-900 text-sm"
                  >
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    id="businessPhone"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                    placeholder="+977-..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="businessWebsite"
                    className="block mb-2 font-semibold text-gray-900 text-sm"
                  >
                    Business Website
                  </label>
                  <input
                    type="url"
                    id="businessWebsite"
                    name="businessWebsite"
                    value={formData.businessWebsite}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="mb-5">
                <label
                  htmlFor="businessAddress"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Business Address
                </label>
                <textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  placeholder="Full business address"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* Business License Document */}
              <div className="mb-5">
                <label
                  htmlFor="licenseFile"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Business License/Registration Document *
                </label>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-rose-500 transition-colors">
                  {!formData.licenseFile ? (
                    <>
                      <div className="mb-3">
                        <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <label
                        htmlFor="licenseFile"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Choose File
                      </label>
                      <input
                        type="file"
                        id="licenseFile"
                        name="licenseFile"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        required
                        className="hidden"
                      />
                      <p className="text-xs sm:text-sm text-gray-500 mt-2">
                        PNG, JPG, or PDF (Max 5MB)
                      </p>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {/* Image Preview */}
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="License preview"
                            className="max-h-48 sm:max-h-64 rounded-lg border border-gray-300"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="ml-3 text-left">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{formData.licenseFile.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">{(formData.licenseFile.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                      )}

                      {/* File Actions */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-green-600 truncate max-w-[200px]">
                          {formData.licenseFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={clearFile}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Change File Button */}
                      <label
                        htmlFor="licenseFile"
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Change File
                      </label>
                      <input
                        type="file"
                        id="licenseFile"
                        name="licenseFile"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <strong className="text-blue-900 text-sm">Verification Requirements:</strong>
                <ul className="text-blue-900 text-xs sm:text-sm mt-1 ml-4 list-disc space-y-0.5">
                  <li>Business name must match your registration document</li>
                  <li>Upload a clear copy of your business license/registration</li>
                  <li>Provide accurate contact information</li>
                  <li>Review usually takes 1-2 business days</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  className="flex-1 py-3 sm:py-4"
                >
                  {loading
                    ? 'Submitting...'
                    : isFreeVerification
                      ? 'Submit for Verification'
                      : 'Proceed to Payment'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 sm:flex-initial sm:px-8 py-3 sm:py-4"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              {/* Payment Step */}
              <div className="mb-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Order Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verification Plan:</span>
                      <span className="font-medium">{getDurationLabel()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium truncate max-w-[180px]">{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold text-rose-600">NPR {price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onSelect={setSelectedPaymentMethod}
                  amount={price}
                  disabled={loading}
                  showTestInfo={isDevelopment}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handlePaidSubmit}
                  variant="primary"
                  loading={loading}
                  disabled={loading || !selectedPaymentMethod}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 py-3 sm:py-4"
                >
                  {loading ? 'Processing...' : `Pay NPR ${price.toLocaleString()}`}
                </Button>
                <Button
                  onClick={handleBackToForm}
                  variant="secondary"
                  disabled={loading}
                  className="flex-1 sm:flex-initial sm:px-8 py-3 sm:py-4"
                >
                  Back
                </Button>
              </div>

              {/* Security Note */}
              <p className="text-center text-xs text-gray-400 mt-4">
                You will be redirected to {selectedPaymentMethod === 'khalti' ? 'Khalti' : selectedPaymentMethod === 'esewa' ? 'eSewa' : 'payment gateway'} to complete your payment securely.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
