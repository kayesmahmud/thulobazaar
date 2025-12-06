'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { useVerificationForm } from '@/hooks/useVerificationForm';
import {
  VerificationModal,
  FormAlert,
  PlanSummary,
  FormTips,
  OrderSummary,
} from '@/components/verification';

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
  isResubmission?: boolean;
}

const initialFormData: FormData = {
  businessName: '',
  businessCategory: '',
  businessDescription: '',
  businessWebsite: '',
  businessPhone: '',
  businessAddress: '',
  licenseFile: null,
};

export default function BusinessVerificationForm({
  onSuccess,
  onCancel,
  durationDays,
  price,
  isFreeVerification,
  isResubmission = false,
}: BusinessVerificationFormProps) {
  const {
    formData,
    setFormData,
    loading,
    error,
    step,
    selectedPaymentMethod,
    setError,
    setSelectedPaymentMethod,
    handleProceedToPayment,
    handleBackToForm,
    submitFreeVerification,
    submitPaidVerification,
  } = useVerificationForm<FormData>(initialFormData, {
    type: 'business',
    durationDays,
    price,
    isFreeVerification,
    isResubmission,
    onSuccess,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  // Validate form
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

  // Build FormData for submission
  const buildSubmitData = (): globalThis.FormData => {
    const submitData = new FormData();
    submitData.append('business_name', formData.businessName.trim());
    submitData.append('business_license_document', formData.licenseFile!);

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

    return submitData;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isFreeVerification || isResubmission) {
      const submitData = buildSubmitData();
      await submitFreeVerification(submitData, '/api/verification/business');
    } else {
      handleProceedToPayment(validateForm);
    }
  };

  // Handle paid submission
  const handlePaidSubmit = async () => {
    if (!validateForm()) return;

    const submitData = buildSubmitData();
    await submitPaidVerification(
      submitData,
      '/api/verification/business',
      'business_verification',
      `Business Verification - ${durationDays} days`,
      { businessName: formData.businessName.trim() }
    );
  };

  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  return (
    <VerificationModal
      type="business"
      durationDays={durationDays}
      step={step}
      isFreeVerification={isFreeVerification}
      onClose={onCancel}
    >
      {/* Error Alert */}
      {error && <FormAlert message={error} type="error" />}

      {step === 'form' ? (
        <form onSubmit={handleSubmit}>
          {/* Plan Summary */}
          <PlanSummary
            type="business"
            durationDays={durationDays}
            price={price}
            isFreeVerification={isFreeVerification}
            isResubmission={isResubmission}
          />

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
                    <svg
                      className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <label
                    htmlFor="licenseFile"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
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
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">PNG, JPG, or PDF (Max 5MB)</p>
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
                      <svg
                        className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="ml-3 text-left">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {formData.licenseFile.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {(formData.licenseFile.size / 1024).toFixed(2)} KB
                        </p>
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
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
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
          <FormTips type="business" />

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
                : isFreeVerification || isResubmission
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
            <OrderSummary
              type="business"
              durationDays={durationDays}
              price={price}
              displayName={formData.businessName}
            />

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
            You will be redirected to{' '}
            {selectedPaymentMethod === 'khalti'
              ? 'Khalti'
              : selectedPaymentMethod === 'esewa'
                ? 'eSewa'
                : 'payment gateway'}{' '}
            to complete your payment securely.
          </p>
        </>
      )}
    </VerificationModal>
  );
}
