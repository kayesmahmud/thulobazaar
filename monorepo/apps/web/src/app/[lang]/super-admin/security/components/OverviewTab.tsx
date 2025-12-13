'use client';

import type { AuditData } from '../types';
import { getActionTypeColor } from '../types';

interface OverviewTabProps {
  auditData: AuditData;
}

export default function OverviewTab({ auditData }: OverviewTabProps) {
  const { securityOverview, failedLoginAttempts, topIpAddresses, actionTypeStats } = auditData;
  const twoFaPercentage = Math.round((securityOverview.twoFactorAuth.enabled / securityOverview.twoFactorAuth.total) * 100);

  return (
    <div className="space-y-6">
      {/* Security Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Failed Logins (24h)</div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🚫</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {securityOverview.failedLogins.last_24h}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {securityOverview.failedLogins.unique_users} unique users
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Successful Logins</div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {securityOverview.successfulLogins}
          </div>
          <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">2FA Enabled</div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔐</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {securityOverview.twoFactorAuth.enabled}/{securityOverview.twoFactorAuth.total}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {twoFaPercentage}% adoption
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Suspensions (24h)</div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">⛔</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {securityOverview.suspensions.last_24h}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {securityOverview.suspensions.total} total
          </div>
        </div>
      </div>

      {/* Recent Failed Logins */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Failed Login Attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {failedLoginAttempts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No failed login attempts in this time range
                  </td>
                </tr>
              ) : (
                failedLoginAttempts.slice(0, 10).map((attempt, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{attempt.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{attempt.ipAddress || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(attempt.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {attempt.reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top IP Addresses and Action Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top IP Addresses</h2>
          </div>
          <div className="p-6 space-y-3">
            {topIpAddresses.slice(0, 10).map((ip, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-900">{ip.ip_address}</span>
                  <span className="text-xs text-gray-500">{ip.unique_users} users</span>
                </div>
                <span className="text-sm font-semibold text-indigo-600">{ip.request_count} requests</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Action Type Statistics</h2>
          </div>
          <div className="p-6 space-y-3">
            {actionTypeStats.slice(0, 10).map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`text-sm px-2 py-1 rounded ${getActionTypeColor(stat.action_type)}`}>
                  {stat.action_type}
                </span>
                <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
