'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface SuperAdmin {
  id: number;
  full_name: string;
  email: string;
  two_factor_enabled?: boolean;
}

interface EditSuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  superAdmin: SuperAdmin | null;
}

export function EditSuperAdminModal({ isOpen, onClose, onSuccess, superAdmin }: EditSuperAdminModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 2FA States
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Pre-populate form when superAdmin changes
  useEffect(() => {
    if (superAdmin) {
      setFormData({
        fullName: superAdmin.full_name,
        email: superAdmin.email,
        password: '',
        confirmPassword: '',
      });
      setTwoFactorEnabled(superAdmin?.two_factor_enabled || false);
    }
  }, [superAdmin]);

  if (!isOpen || !superAdmin) return null;

  // Handle 2FA Toggle
  const handle2FAToggle = async (enabled: boolean) => {
    if (enabled) {
      // Enable 2FA - Show setup modal
      setTwoFactorLoading(true);
      try {
        const response = await apiClient.setup2FA(superAdmin.id);
        if (response.success && response.data) {
          setQrCode(response.data.qrCode);
          setSecret(response.data.secret);
          setShow2FASetup(true);
          setVerificationCode('');
        } else {
          setErrors({ twoFactor: 'Failed to setup 2FA. Please try again.' });
          setTwoFactorEnabled(false);
        }
      } catch (error: any) {
        console.error('Error setting up 2FA:', error);
        setErrors({ twoFactor: error.response?.data?.message || 'Failed to setup 2FA. Please try again.' });
        setTwoFactorEnabled(false);
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      // Disable 2FA - Confirm first
      if (confirm('Are you sure you want to disable 2FA? This will reduce account security.')) {
        setTwoFactorLoading(true);
        try {
          const response = await apiClient.disable2FA(superAdmin.id);
          if (response.success) {
            setTwoFactorEnabled(false);
            onSuccess(); // Refresh the list
          } else {
            setErrors({ twoFactor: 'Failed to disable 2FA. Please try again.' });
            setTwoFactorEnabled(true);
          }
        } catch (error: any) {
          console.error('Error disabling 2FA:', error);
          setErrors({ twoFactor: error.response?.data?.message || 'Failed to disable 2FA. Please try again.' });
          setTwoFactorEnabled(true);
        } finally {
          setTwoFactorLoading(false);
        }
      } else {
        setTwoFactorEnabled(true);
      }
    }
  };

  // Verify 2FA Code
  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ verification: 'Please enter a valid 6-digit code' });
      return;
    }

    setTwoFactorLoading(true);
    try {
      const response = await apiClient.verify2FA(superAdmin.id, {
        secret: secret,
        token: verificationCode,
      });

      if (response.success && response.data) {
        setBackupCodes(response.data.backupCodes);
        setShow2FASetup(false);
        setShowBackupCodes(true);
        setTwoFactorEnabled(true);
        onSuccess(); // Refresh the list
      } else {
        setErrors({ verification: (response as any).message || 'Invalid verification code. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      setErrors({ verification: error.response?.data?.message || 'Invalid verification code. Please try again.' });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Close 2FA Setup Modal
  const close2FASetup = () => {
    setShow2FASetup(false);
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setErrors({});
    setTwoFactorEnabled(superAdmin?.two_factor_enabled || false);
  };

  // Close Backup Codes Modal
  const closeBackupCodes = () => {
    setShowBackupCodes(false);
    setBackupCodes([]);
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password is optional for editing
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare update data - only include changed fields (2FA is handled separately)
      const updateData: any = {};
      if (formData.fullName !== superAdmin.full_name) updateData.full_name = formData.fullName;
      if (formData.email !== superAdmin.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;

      // Call API to update super admin
      const response = await apiClient.updateSuperAdmin(superAdmin.id, updateData);

      if (response.success) {
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setErrors({});

        onSuccess();
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to update super admin. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error updating super admin:', error);
      setErrors({ submit: error.response?.data?.message || error.message || 'Failed to update super admin. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Edit Super Admin</h2>
              <p className="text-indigo-100 text-sm mt-1">Update super admin information</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Full Name */}
          <div className="mb-5">
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                errors.fullName
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
              }`}
              placeholder="Enter super admin's full name"
            />
            {errors.fullName && <p className="text-rose-600 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                errors.email
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
              }`}
              placeholder="superadmin@thulobazaar.com"
            />
            {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              New Password <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                errors.password
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
              }`}
              placeholder="Minimum 8 characters"
            />
            {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          {formData.password && (
            <div className="mb-5">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all ${
                  errors.confirmPassword
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                    : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                }`}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <p className="text-rose-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
            <div>
              <label className="font-semibold text-gray-900">Two-Factor Authentication</label>
              <p className="text-sm text-gray-600 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setTwoFactorEnabled(newValue);
                  handle2FAToggle(newValue);
                }}
                disabled={twoFactorLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          {errors.twoFactor && <p className="text-rose-600 text-sm mt-1 mb-4">{errors.twoFactor}</p>}

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-5 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
              <p className="text-rose-700 text-sm font-semibold">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Super Admin'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Setup 2FA</h3>
                  <p className="text-emerald-100 text-sm mt-1">Scan QR code with Google Authenticator</p>
                </div>
                <button
                  onClick={close2FASetup}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Step 1: Scan QR Code */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center">1</div>
                  <h4 className="font-semibold text-gray-900">Scan QR Code</h4>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
                  {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48" />}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Use Google Authenticator app to scan this QR code
                </p>
              </div>

              {/* Step 2: Enter Verification Code */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center">2</div>
                  <h4 className="font-semibold text-gray-900">Enter Verification Code</h4>
                </div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setErrors({ ...errors, verification: '' });
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none transition-all ${
                    errors.verification
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                      : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
                  }`}
                />
                {errors.verification && <p className="text-rose-600 text-sm mt-2">{errors.verification}</p>}
              </div>

              {/* Manual Entry Option */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">Can&apos;t scan? Enter manually:</p>
                <code className="text-xs bg-white px-3 py-2 rounded border border-amber-300 block break-all font-mono">
                  {secret}
                </code>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={close2FASetup}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={twoFactorLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerify2FA}
                  disabled={twoFactorLoading || verificationCode.length !== 6}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {twoFactorLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">2FA Enabled Successfully!</h3>
                  <p className="text-emerald-100 text-sm mt-1">Save your backup codes</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Warning */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Important!</p>
                    <p className="text-sm text-gray-700">
                      Save these backup codes in a secure location. You can use them to access your account if you lose your phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded border border-gray-200 text-center">
                      <code className="text-sm font-mono text-gray-900">{code}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={copyBackupCodes}
                  className="flex-1 px-6 py-3 border-2 border-emerald-200 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Codes
                </button>
                <button
                  type="button"
                  onClick={closeBackupCodes}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
