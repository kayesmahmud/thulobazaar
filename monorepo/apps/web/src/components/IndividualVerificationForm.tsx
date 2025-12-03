'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import type { PaymentGateway } from '@/lib/paymentGateways/types';

interface FormData {
  fullName: string;
  idType: 'citizenship' | 'passport' | 'driving_license';
  idNumber: string;
  idFrontFile: File | null;
  idBackFile: File | null;
  selfieFile: null;
}

interface IndividualVerificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  durationDays: number;
  price: number;
  isFreeVerification: boolean;
}

export default function IndividualVerificationForm({
  onSuccess,
  onCancel,
  durationDays,
  price,
  isFreeVerification,
}: IndividualVerificationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    idType: 'citizenship',
    idNumber: '',
    idFrontFile: null,
    idBackFile: null,
    selfieFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway | null>(null);

  // Handle text input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle file input changes
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setError(null);
    }
  };

  // Get duration label
  const getDurationLabel = () => {
    if (durationDays === 30) return '1 Month';
    if (durationDays === 90) return '3 Months';
    if (durationDays === 180) return '6 Months';
    if (durationDays === 365) return '1 Year';
    return `${durationDays} Days`;
  };

  // Validate form before proceeding to payment
  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }

    if (!formData.idNumber.trim()) {
      setError('Please enter your ID document number');
      return false;
    }

    if (!formData.idFrontFile) {
      setError('Please upload front image of your ID document');
      return false;
    }

    if (!formData.selfieFile) {
      setError('Please upload a selfie holding your ID document');
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

  // Handle form submission (for free verifications)
  const handleFreeSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Generate mock transaction ID for free verification
      const mockTransactionId = `FREE_IND_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create FormData
      const submitData = new FormData();
      submitData.append('full_name', formData.fullName.trim());
      submitData.append('id_document_type', formData.idType);
      submitData.append('id_document_number', formData.idNumber.trim());
      submitData.append('id_document_front', formData.idFrontFile!);

      if (formData.idBackFile) {
        submitData.append('id_document_back', formData.idBackFile);
      }

      submitData.append('selfie_with_id', formData.selfieFile!);
      submitData.append('duration_days', durationDays.toString());
      submitData.append('payment_reference', mockTransactionId);
      submitData.append('payment_amount', '0');
      submitData.append('payment_status', 'free');

      // Submit via API client
      await apiClient.submitIndividualVerification(submitData);
      onSuccess();
    } catch (err: unknown) {
      console.error('Verification submission error:', err);
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

      // Step 1: Submit verification form with files to get verification request ID
      // This creates a record with status 'pending_payment'
      const submitData = new FormData();
      submitData.append('full_name', formData.fullName.trim());
      submitData.append('id_document_type', formData.idType);
      submitData.append('id_document_number', formData.idNumber.trim());
      submitData.append('id_document_front', formData.idFrontFile!);
      if (formData.idBackFile) {
        submitData.append('id_document_back', formData.idBackFile);
      }
      submitData.append('selfie_with_id', formData.selfieFile!);
      submitData.append('duration_days', durationDays.toString());
      submitData.append('payment_reference', 'PENDING'); // Will be updated after payment
      submitData.append('payment_amount', price.toString());
      submitData.append('payment_status', 'pending'); // Not free, not paid yet

      const verificationResponse = await fetch('/api/verification/individual', {
        method: 'POST',
        credentials: 'include',
        body: submitData,
      });

      const verificationData = await verificationResponse.json();

      if (!verificationData.success) {
        throw new Error(verificationData.message || 'Failed to submit verification');
      }

      const verificationRequestId = verificationData.data.requestId;
      console.log('✅ Verification submitted with ID:', verificationRequestId, 'Status:', verificationData.data.status);

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
          paymentType: 'individual_verification',
          relatedId: verificationRequestId, // Link payment to verification request
          orderName: `Individual Verification - ${getDurationLabel()}`,
          metadata: {
            durationDays,
            fullName: formData.fullName.trim(),
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

  // Handle form submit based on whether it's free or paid
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
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 sm:p-6 rounded-t-xl z-10">
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 'form' ? 'Individual Seller Verification' : 'Complete Payment'}
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
                  step === 'form' ? 'bg-white text-indigo-600' : 'bg-white/30 text-white'
                }`}>1</span>
                <span className="text-sm hidden sm:inline">Fill Details</span>
              </div>
              <div className="w-8 h-0.5 bg-white/30" />
              <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'opacity-100' : 'opacity-60'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === 'payment' ? 'bg-white text-indigo-600' : 'bg-white/30 text-white'
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
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{isFreeVerification ? '🎁' : '✓'}</span>
                    <div>
                      <div className="font-bold text-gray-900">
                        {getDurationLabel()} Verification
                      </div>
                      <div className="text-sm text-gray-600">
                        {isFreeVerification
                          ? 'Free promotional offer for new users'
                          : 'Get verified seller badge'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold ${isFreeVerification ? 'text-green-600' : 'text-indigo-600'}`}>
                    {isFreeVerification ? 'FREE' : `NPR ${price.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="mb-5">
                <label
                  htmlFor="fullName"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Full Name (as on ID document) *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name exactly as shown on ID"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  This name will be verified and displayed with your blue badge
                </p>
              </div>

              {/* ID Document Type */}
              <div className="mb-5">
                <label
                  htmlFor="idType"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  ID Document Type *
                </label>
                <select
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="citizenship">Citizenship</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>

              {/* ID Document Number */}
              <div className="mb-5">
                <label
                  htmlFor="idNumber"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  ID Document Number *
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your ID number"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* File Upload Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* ID Document Front Image */}
                <div>
                  <label
                    htmlFor="idFrontFile"
                    className="block mb-2 font-semibold text-gray-900 text-sm"
                  >
                    ID Front Image *
                  </label>
                  <input
                    type="file"
                    id="idFrontFile"
                    name="idFrontFile"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    required
                    className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                </div>

                {/* ID Document Back Image */}
                <div>
                  <label
                    htmlFor="idBackFile"
                    className="block mb-2 font-semibold text-gray-900 text-sm"
                  >
                    ID Back Image {formData.idType !== 'passport' && '*'}
                  </label>
                  <input
                    type="file"
                    id="idBackFile"
                    name="idBackFile"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    required={formData.idType !== 'passport'}
                    className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.idType === 'passport' ? 'Optional' : 'Max 5MB'}
                  </p>
                </div>
              </div>

              {/* Selfie with ID */}
              <div className="mb-5">
                <label
                  htmlFor="selfieFile"
                  className="block mb-2 font-semibold text-gray-900 text-sm sm:text-base"
                >
                  Selfie with ID Document *
                </label>
                <input
                  type="file"
                  id="selfieFile"
                  name="selfieFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                  className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Clear selfie holding your ID next to your face
                </p>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <strong className="text-blue-900 text-sm">Tips:</strong>
                <ul className="text-blue-900 text-xs sm:text-sm mt-1 ml-4 list-disc space-y-0.5">
                  <li>Ensure all photos are clear and readable</li>
                  <li>Your face and ID details should be visible</li>
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
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold text-indigo-600">NPR {price.toLocaleString()}</span>
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
