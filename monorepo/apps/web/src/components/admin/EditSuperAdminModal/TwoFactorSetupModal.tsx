'use client';

interface TwoFactorSetupModalProps {
  qrCode: string;
  secret: string;
  verificationCode: string;
  onVerificationCodeChange: (code: string) => void;
  onVerify: () => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
  onClearError: () => void;
}

export function TwoFactorSetupModal({
  qrCode,
  secret,
  verificationCode,
  onVerificationCodeChange,
  onVerify,
  onClose,
  loading,
  error,
  onClearError,
}: TwoFactorSetupModalProps) {
  return (
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
              onClick={onClose}
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
                onVerificationCodeChange(value);
                onClearError();
              }}
              placeholder="000000"
              maxLength={6}
              className={`w-full px-4 py-3 border-2 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none transition-all ${
                error
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-50'
                  : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
              }`}
            />
            {error && <p className="text-rose-600 text-sm mt-2">{error}</p>}
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
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
