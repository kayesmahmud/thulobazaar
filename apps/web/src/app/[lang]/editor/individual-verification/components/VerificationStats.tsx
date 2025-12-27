'use client';

import type { IndividualVerification, TabStatus } from './types';

interface VerificationStatsProps {
  activeTab: TabStatus;
  verifications: IndividualVerification[];
}

export function VerificationStats({ activeTab, verifications }: VerificationStatsProps) {
  const tabStyles = {
    pending: { bg: 'from-purple-50 to-purple-100 border-purple-200', text: 'text-purple-', icon: '🪪' },
    rejected: { bg: 'from-red-50 to-red-100 border-red-200', text: 'text-red-', icon: '❌' },
    approved: { bg: 'from-green-50 to-green-100 border-green-200', text: 'text-green-', icon: '✅' },
  };

  const tabLabels = {
    pending: 'Total Pending',
    rejected: 'Total Rejected',
    approved: 'Total Verified',
  };

  const style = tabStyles[activeTab];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className={`bg-gradient-to-br ${style.bg} border-2 rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-sm font-medium mb-1 ${style.text}700`}>
              {tabLabels[activeTab]}
            </div>
            <div className={`text-3xl font-bold ${style.text}900`}>
              {verifications.length}
            </div>
          </div>
          <div className="text-4xl">{style.icon}</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-700 mb-1">With Phone</div>
            <div className="text-3xl font-bold text-blue-900">
              {verifications.filter((v) => v.phone).length}
            </div>
          </div>
          <div className="text-4xl">📞</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-amber-700 mb-1">
              {activeTab === 'rejected' ? 'Recent Rejections' : 'Processing Time'}
            </div>
            <div className="text-3xl font-bold text-amber-900">
              {activeTab === 'rejected' ? verifications.length : '1-2d'}
            </div>
          </div>
          <div className="text-4xl">{activeTab === 'rejected' ? '📋' : '⏱️'}</div>
        </div>
      </div>
    </div>
  );
}
