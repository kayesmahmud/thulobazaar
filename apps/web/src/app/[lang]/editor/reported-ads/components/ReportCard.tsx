'use client';

import type { ReportedAd, TabStatus } from '../types';

interface ReportCardProps {
  report: ReportedAd;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onDeleteAd: (adId: number, reason: string) => void;
  onDismissReport: (reportId: number) => void;
  onRestoreAd: (adId: number, title: string) => void;
}

const getReasonBadge = (reason: string) => {
  const badges: Record<string, string> = {
    spam: 'bg-red-100 text-red-800 border-red-200',
    fraud: 'bg-orange-100 text-orange-800 border-orange-200',
    scam: 'bg-orange-100 text-orange-800 border-orange-200',
    inappropriate: 'bg-purple-100 text-purple-800 border-purple-200',
    duplicate: 'bg-blue-100 text-blue-800 border-blue-200',
    misleading: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return badges[reason.toLowerCase()] || badges.other;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'restored':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'dismissed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-red-100 text-red-800 border-red-200';
  }
};

export default function ReportCard({
  report,
  activeTab,
  lang,
  actionLoading,
  onDeleteAd,
  onDismissReport,
  onRestoreAd,
}: ReportCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow ${
        activeTab === 'pending'
          ? 'border-red-100'
          : activeTab === 'resolved'
          ? 'border-green-100'
          : activeTab === 'restored'
          ? 'border-blue-100'
          : 'border-gray-100'
      }`}
    >
      <div className="p-6">
        {/* Report Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeTab === 'pending'
                ? 'bg-red-100'
                : activeTab === 'resolved'
                ? 'bg-green-100'
                : activeTab === 'restored'
                ? 'bg-blue-100'
                : 'bg-gray-100'
            }`}>
              <span className="text-2xl">
                {activeTab === 'pending' ? '🚩' : activeTab === 'resolved' ? '🗑️' : activeTab === 'restored' ? '♻️' : '✅'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Report #</span>
                <span className="text-sm font-bold text-gray-900">{report.reportId}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getReasonBadge(report.reason)}`}>
                  {report.reason.toUpperCase()}
                </span>
                {activeTab !== 'pending' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(report.status)}`}>
                    {report.status.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Reported {new Date(report.reportedAt).toLocaleString('en-US')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Ad Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Reported Ad
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{report.adTitle}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.adDescription}</p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-gray-600">💰 NPR {report.price?.toLocaleString()}</span>
                <span className="text-gray-600">Ad ID: #{report.adId}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    report.adStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : report.adStatus === 'deleted'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {report.adStatus}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Seller:</div>
                <div className="text-sm font-medium text-gray-900">
                  {report.sellerName} ({report.sellerEmail})
                </div>
              </div>
            </div>
          </div>

          {/* Right: Report Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Report Details
            </h4>
            <div className={`p-4 rounded-lg border ${
              activeTab === 'pending'
                ? 'bg-red-50 border-red-200'
                : activeTab === 'resolved'
                ? 'bg-green-50 border-green-200'
                : activeTab === 'restored'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="mb-3">
                <div className={`text-xs mb-1 font-medium ${
                  activeTab === 'pending' ? 'text-red-700' : activeTab === 'restored' ? 'text-blue-700' : 'text-gray-700'
                }`}>Reporter:</div>
                <div className="text-sm text-gray-900">
                  {report.reporterName} ({report.reporterEmail})
                </div>
                <div className="text-xs text-gray-500 mt-1">User ID: #{report.reporterId}</div>
              </div>
              {report.description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className={`text-xs mb-1 font-medium ${
                    activeTab === 'pending' ? 'text-red-700' : activeTab === 'restored' ? 'text-blue-700' : 'text-gray-700'
                  }`}>Description:</div>
                  <div className="text-sm text-gray-900">{report.description}</div>
                </div>
              )}
              {report.adminNotes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className={`text-xs mb-1 font-medium ${activeTab === 'restored' ? 'text-blue-700' : 'text-green-700'}`}>Resolution Notes:</div>
                  <div className="text-sm text-gray-900">{report.adminNotes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 flex-wrap">
          <button
            onClick={() => window.open(`/${lang}/ad/${report.adSlug}`, '_blank')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            👁️ View Ad
          </button>

          {activeTab === 'pending' && (
            <>
              <button
                onClick={() => onDeleteAd(report.adId, report.reason)}
                disabled={actionLoading}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Delete Ad
              </button>
              <button
                onClick={() => onDismissReport(report.reportId)}
                disabled={actionLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Dismiss Report
              </button>
            </>
          )}

          {activeTab === 'resolved' && (
            <button
              onClick={() => onRestoreAd(report.adId, report.adTitle)}
              disabled={actionLoading}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ♻️ Restore Ad
            </button>
          )}

          <button
            onClick={() =>
              alert(`Contact Reporter: ${report.reporterEmail}\nContact Seller: ${report.sellerEmail}`)
            }
            className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📧 Contact
          </button>
        </div>
      </div>
    </div>
  );
}
