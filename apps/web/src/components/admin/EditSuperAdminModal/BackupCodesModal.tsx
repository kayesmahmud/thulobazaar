'use client';

interface BackupCodesModalProps {
  backupCodes: string[];
  onCopy: () => void;
  onClose: () => void;
}

export function BackupCodesModal({ backupCodes, onCopy, onClose }: BackupCodesModalProps) {
  return (
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
              onClick={onCopy}
              className="flex-1 px-6 py-3 border-2 border-emerald-200 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Codes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
