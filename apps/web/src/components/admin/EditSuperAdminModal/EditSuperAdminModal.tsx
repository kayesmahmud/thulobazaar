'use client';

import { useEffect } from 'react';
import type { EditSuperAdminModalProps } from './types';
import { useEditSuperAdminForm } from './useEditSuperAdminForm';
import { use2FASetup } from './use2FASetup';
import { TwoFactorSetupModal } from './TwoFactorSetupModal';
import { BackupCodesModal } from './BackupCodesModal';

export function EditSuperAdminModal({ isOpen, onClose, onSuccess, superAdmin }: EditSuperAdminModalProps) {
  const {
    formData,
    loading,
    errors,
    setErrors,
    handleSubmit,
    updateFormData,
  } = useEditSuperAdminForm({ superAdmin, onSuccess, onClose });

  const {
    twoFactorState,
    handle2FAToggle,
    handleVerify2FA,
    close2FASetup,
    closeBackupCodes,
    copyBackupCodes,
    setVerificationCode,
    syncTwoFactorEnabled,
  } = use2FASetup({
    superAdmin,
    onSuccess,
    setErrors: (updater) => setErrors(prev => updater(prev)),
  });

  // Sync 2FA enabled state when superAdmin changes
  useEffect(() => {
    if (superAdmin) {
      syncTwoFactorEnabled(superAdmin.two_factor_enabled || false);
    }
  }, [superAdmin, syncTwoFactorEnabled]);

  if (!isOpen || !superAdmin) return null;

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
              onChange={(e) => updateFormData('fullName', e.target.value)}
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
              onChange={(e) => updateFormData('email', e.target.value)}
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
              onChange={(e) => updateFormData('password', e.target.value)}
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
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
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
                checked={twoFactorState.twoFactorEnabled}
                onChange={(e) => handle2FAToggle(e.target.checked)}
                disabled={twoFactorState.twoFactorLoading}
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
      {twoFactorState.show2FASetup && (
        <TwoFactorSetupModal
          qrCode={twoFactorState.qrCode}
          secret={twoFactorState.secret}
          verificationCode={twoFactorState.verificationCode}
          onVerificationCodeChange={setVerificationCode}
          onVerify={handleVerify2FA}
          onClose={close2FASetup}
          loading={twoFactorState.twoFactorLoading}
          error={errors.verification}
          onClearError={() => setErrors(prev => ({ ...prev, verification: '' }))}
        />
      )}

      {/* Backup Codes Modal */}
      {twoFactorState.showBackupCodes && (
        <BackupCodesModal
          backupCodes={twoFactorState.backupCodes}
          onCopy={copyBackupCodes}
          onClose={closeBackupCodes}
        />
      )}
    </div>
  );
}
