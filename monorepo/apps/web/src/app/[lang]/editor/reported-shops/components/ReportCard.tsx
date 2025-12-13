'use client';

import type { ReportedShop, TabStatus } from './types';
import { getReasonBadge, getStatusBadge } from './helpers';

interface ReportCardProps {
  report: ReportedShop;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onSuspendShop: (shopId: number, reportId: number, reportReason: string) => void;
  onDismissReport: (reportId: number) => void;
  onUnsuspendShop: (shopId: number, reportId: number, shopName: string) => void;
}

export function ReportCard({
  report,
  activeTab,
  lang,
  actionLoading,
  onSuspendShop,
  onDismissReport,
  onUnsuspendShop,
}: ReportCardProps) {
  const reasonBadge = getReasonBadge(report.reason);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow ${
        activeTab === 'pending'
          ? 'border-orange-100'
          : activeTab === 'resolved'
          ? 'border-red-100'
          : 'border-gray-100'
      }`}
    >
      <div className="p-6">
        {/* Report Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                activeTab === 'pending'
                  ? 'bg-orange-100'
                  : activeTab === 'resolved'
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              }`}
            >
              <span className="text-2xl">
                {activeTab === 'pending' ? '🏪' : activeTab === 'resolved' ? '🚫' : '✅'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-gray-600">Report #</span>
                <span className="text-sm font-bold text-gray-900">{report.reportId}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold border ${reasonBadge.className}`}
                >
                  {reasonBadge.icon} {reasonBadge.label}
                </span>
                {activeTab !== 'pending' && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(report.status)}`}
                  >
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
          {/* Left: Shop Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Reported Shop
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {report.shopAvatar &&
                (report.shopAvatar.startsWith('http') || report.shopAvatar.startsWith('/')) ? (
                  <img
                    src={report.shopAvatar}
                    alt={report.shopName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-orange-700">
                      {report.shopName?.charAt(0)?.toUpperCase() || '🏪'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{report.shopName}</h3>
                  <p className="text-sm text-gray-600">{report.shopEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-gray-600">Shop ID: #{report.shopId}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    report.shopIsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {report.shopIsActive ? 'Active' : 'Suspended'}
                </span>
                {report.shopVerificationStatus === 'approved' && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Verified Business
                  </span>
                )}
                {report.shopIndividualVerified && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    Verified Individual
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Report Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Report Details
            </h4>
            <div
              className={`p-4 rounded-lg border ${
                activeTab === 'pending'
                  ? 'bg-orange-50 border-orange-200'
                  : activeTab === 'resolved'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="mb-3">
                <div
                  className={`text-xs mb-1 font-medium ${
                    activeTab === 'pending' ? 'text-orange-700' : 'text-gray-700'
                  }`}
                >
                  Reporter:
                </div>
                <div className="text-sm text-gray-900">
                  {report.reporterName} ({report.reporterEmail})
                </div>
                <div className="text-xs text-gray-500 mt-1">User ID: #{report.reporterId}</div>
              </div>
              {report.description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div
                    className={`text-xs mb-1 font-medium ${
                      activeTab === 'pending' ? 'text-orange-700' : 'text-gray-700'
                    }`}
                  >
                    Description:
                  </div>
                  <div className="text-sm text-gray-900">{report.description}</div>
                </div>
              )}
              {report.adminNotes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-green-700 mb-1 font-medium">Resolution Notes:</div>
                  <div className="text-sm text-gray-900">{report.adminNotes}</div>
                </div>
              )}
              {report.resolverName && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-blue-700 mb-1 font-medium">Handled By:</div>
                  <div className="text-sm text-gray-900 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {report.resolverName}
                    </span>
                    <span className="text-gray-500">({report.resolverEmail})</span>
                    {report.resolverRole && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          report.resolverRole === 'super_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {report.resolverRole === 'super_admin' ? 'Super Admin' : 'Editor'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {report.updatedAt &&
                      `Resolved on ${new Date(report.updatedAt).toLocaleString('en-US')}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 flex-wrap">
          <button
            onClick={() => window.open(`/${lang}/shop/${report.shopSlug}`, '_blank')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Shop
          </button>

          {activeTab === 'pending' && (
            <>
              <button
                onClick={() => onSuspendShop(report.shopId, report.reportId, report.reason)}
                disabled={actionLoading || !report.shopIsActive}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend Shop
              </button>
              <button
                onClick={() => onDismissReport(report.reportId)}
                disabled={actionLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dismiss Report
              </button>
            </>
          )}

          {activeTab === 'resolved' && !report.shopIsActive && (
            <button
              onClick={() => onUnsuspendShop(report.shopId, report.reportId, report.shopName)}
              disabled={actionLoading}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Restore Shop
            </button>
          )}

          <button
            onClick={() =>
              alert(`Contact Reporter: ${report.reporterEmail}\nContact Shop: ${report.shopEmail}`)
            }
            className="ml-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}
