'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';

interface FormData {
  fullName: string;
  idType: 'citizenship' | 'passport' | 'driving_license';
  idNumber: string;
  idFrontFile: File | null;
  idBackFile: File | null;
  selfieFile: File | null;
}

interface IndividualVerificationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function IndividualVerificationForm({
  onSuccess,
  onCancel,
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

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.idNumber.trim()) {
      setError('Please enter your ID document number');
      return;
    }

    if (!formData.idFrontFile) {
      setError('Please upload front image of your ID document');
      return;
    }

    if (!formData.selfieFile) {
      setError('Please upload a selfie holding your ID document');
      return;
    }

    try {
      setLoading(true);

      // Create FormData with snake_case field names that match backend expectations
      const submitData = new FormData();
      submitData.append('full_name', formData.fullName.trim());
      submitData.append('id_document_type', formData.idType);
      submitData.append('id_document_number', formData.idNumber.trim());
      submitData.append('id_document_front', formData.idFrontFile);

      if (formData.idBackFile) {
        submitData.append('id_document_back', formData.idBackFile);
      }

      submitData.append('selfie_with_id', formData.selfieFile);

      // Debug logging
      console.log('📝 Submitting verification with FormData:');
      for (const pair of submitData.entries()) {
        const [key, value] = pair;
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      // Submit via API client
      await apiClient.submitIndividualVerification(submitData);

      // Success!
      alert('✅ Verification request submitted successfully! Your application is under review.');
      onSuccess();
    } catch (err: any) {
      console.error('❌ Verification submission error:', err);
      // Extract the error message from the backend response
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to submit verification request';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto relative">
        {/* Close button */}
        <button
          onClick={onCancel}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold bg-transparent border-none cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-rose-500 mb-6">
            Individual Seller Verification
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="mb-6">
            <label
              htmlFor="fullName"
              className="block mb-2 font-semibold text-gray-900"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              This name will be verified against your ID document and displayed with blue badge
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <strong className="text-yellow-900">⚠️ Important:</strong>
            <p className="text-yellow-900 text-sm mt-1">
              Make sure the name you enter above matches exactly with the name on your ID document.
              Any mismatch will result in rejection.
            </p>
          </div>

          {/* ID Document Type */}
          <div className="mb-6">
            <label
              htmlFor="idType"
              className="block mb-2 font-semibold text-gray-900"
            >
              ID Document Type *
            </label>
            <select
              id="idType"
              name="idType"
              value={formData.idType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="citizenship">Citizenship</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </select>
          </div>

          {/* ID Document Number */}
          <div className="mb-6">
            <label
              htmlFor="idNumber"
              className="block mb-2 font-semibold text-gray-900"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* ID Document Front Image */}
          <div className="mb-6">
            <label
              htmlFor="idFrontFile"
              className="block mb-2 font-semibold text-gray-900"
            >
              ID Document Front Image *
            </label>
            <input
              type="file"
              id="idFrontFile"
              name="idFrontFile"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload clear photo of front side (Max 5MB)
            </p>
          </div>

          {/* ID Document Back Image */}
          <div className="mb-6">
            <label
              htmlFor="idBackFile"
              className="block mb-2 font-semibold text-gray-900"
            >
              ID Document Back Image {formData.idType !== 'passport' && '*'}
            </label>
            <input
              type="file"
              id="idBackFile"
              name="idBackFile"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              required={formData.idType !== 'passport'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.idType === 'passport'
                ? 'Optional for passport'
                : 'Upload clear photo of back side (Max 5MB)'}
            </p>
          </div>

          {/* Selfie with ID */}
          <div className="mb-6">
            <label
              htmlFor="selfieFile"
              className="block mb-2 font-semibold text-gray-900"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Take a clear selfie holding your ID document next to your face (Max 5MB)
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <strong className="text-blue-900">📝 Verification Tips:</strong>
            <ul className="text-blue-900 text-sm mt-2 ml-5 list-disc">
              <li>Ensure all photos are clear and readable</li>
              <li>Your face and ID details should be visible in the selfie</li>
              <li>Avoid glare or shadows on documents</li>
              <li>Review usually takes 1-2 business days</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
