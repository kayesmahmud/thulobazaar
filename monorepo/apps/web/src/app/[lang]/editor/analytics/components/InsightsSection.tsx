'use client';

interface InsightsSectionProps {
  avgResponseTime: number;
  approvalRate: number;
}

export default function InsightsSection({ avgResponseTime, approvalRate }: InsightsSectionProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-6">
      <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
        <span>💡</span> Insights & Recommendations
      </h3>
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Peak Activity Hours</div>
              <div className="text-sm text-gray-600">
                Most ads are submitted between 9 AM - 3 PM. Consider having more editors
                available during these hours.
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Response Time</div>
              <div className="text-sm text-gray-600">
                Current average response time is {avgResponseTime}h. Aim to
                keep it under 2 hours for better user satisfaction.
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-semibold text-gray-900 mb-1">Approval Rate</div>
              <div className="text-sm text-gray-600">
                Your approval rate of {approvalRate}% is healthy. Consistent
                rates indicate clear moderation guidelines.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
