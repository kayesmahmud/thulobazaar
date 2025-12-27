'use client';

import { CheckCircle, XCircle, BadgeCheck, Clock, Users } from 'lucide-react';
import type { AnalyticsData } from '../types';

interface OverviewStatsProps {
  overview: AnalyticsData['overview'];
  editorCount: number;
}

export default function OverviewStats({ overview, editorCount }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-700 mb-1">Total Reviewed</div>
            <div className="text-3xl font-bold text-blue-900">
              {overview.totalAdsReviewed.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-1">Ads moderated</div>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-700 mb-1">Approval Rate</div>
            <div className="text-3xl font-bold text-green-900">
              {overview.approvalRate}%
            </div>
            <div className="text-xs text-green-600 mt-1">
              {overview.totalAdsApproved.toLocaleString()} approved
            </div>
          </div>
          <CheckCircle size={40} className="text-green-600" strokeWidth={2} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red-700 mb-1">Rejected</div>
            <div className="text-3xl font-bold text-red-900">
              {overview.totalAdsRejected.toLocaleString()}
            </div>
            <div className="text-xs text-red-600 mt-1">
              {((overview.totalAdsRejected / overview.totalAdsReviewed) * 100).toFixed(1)}% rejection rate
            </div>
          </div>
          <XCircle size={40} className="text-red-600" strokeWidth={2} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-purple-700 mb-1">Verifications</div>
            <div className="text-3xl font-bold text-purple-900">
              {overview.totalVerifications.toLocaleString()}
            </div>
            <div className="text-xs text-purple-600 mt-1">Processed</div>
          </div>
          <BadgeCheck size={40} className="text-purple-600" strokeWidth={2} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-teal-700 mb-1">Avg Response Time</div>
            <div className="text-3xl font-bold text-teal-900">
              {overview.avgResponseTime}h
            </div>
            <div className="text-xs text-teal-600 mt-1">Per review</div>
          </div>
          <Clock size={40} className="text-teal-600" strokeWidth={2} />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-orange-700 mb-1">Active Editors</div>
            <div className="text-3xl font-bold text-orange-900">{editorCount}</div>
            <div className="text-xs text-orange-600 mt-1">Team members</div>
          </div>
          <Users size={40} className="text-orange-600" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
