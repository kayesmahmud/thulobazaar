'use client';

import { formatNumber, formatCurrency } from './types';
import type { AnalyticsData } from './types';

interface PeriodReportProps {
  period: AnalyticsData['period'];
  summary: AnalyticsData['summary'];
  verifications: AnalyticsData['verifications'];
}

export function PeriodReport({ period, summary, verifications }: PeriodReportProps) {
  if (!summary) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Period Report: {period.label}</h3>
          <p className="text-sm text-gray-500">
            {new Date(period.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            -{' '}
            {new Date(period.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <span className="text-3xl">📋</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">
            {formatNumber(summary.totalNewUsers)}
          </div>
          <div className="text-sm text-blue-600">New Users</div>
          <div className="text-xs text-blue-500 mt-1">~{summary.avgUsersPerDay}/day avg</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {formatNumber(summary.totalNewAds)}
          </div>
          <div className="text-sm text-green-600">New Ads</div>
          <div className="text-xs text-green-500 mt-1">~{summary.avgAdsPerDay}/day avg</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(summary.totalRevenue)}
          </div>
          <div className="text-sm text-purple-600">Total Revenue</div>
          <div className="text-xs text-purple-500 mt-1">
            ~{formatCurrency(summary.avgRevenuePerDay)}/day avg
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-2xl font-bold text-orange-700">{summary.totalTransactions}</div>
          <div className="text-sm text-orange-600">Transactions</div>
          <div className="text-xs text-orange-500 mt-1">
            {summary.verificationsProcessed} verifications
          </div>
        </div>
      </div>

      {/* Period Verification Activity */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Verification Activity This Period</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">
              {verifications.newBusinessRequests}
            </div>
            <div className="text-xs text-gray-500">New Business Requests</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-800">
              {verifications.newIndividualRequests}
            </div>
            <div className="text-xs text-gray-500">New Individual Requests</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {verifications.approvedBusinessInPeriod}
            </div>
            <div className="text-xs text-green-600">Business Approved</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">
              {verifications.approvedIndividualInPeriod}
            </div>
            <div className="text-xs text-green-600">Individual Approved</div>
          </div>
        </div>
      </div>
    </div>
  );
}
