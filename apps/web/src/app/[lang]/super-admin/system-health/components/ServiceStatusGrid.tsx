'use client';

import type { ServiceStatus } from '../types';
import { getStatusColor } from '../types';

interface ServiceStatusGridProps {
  serviceStatus: Record<string, ServiceStatus>;
}

export default function ServiceStatusGrid({ serviceStatus }: ServiceStatusGridProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Service Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(serviceStatus).map(([service, status]) => (
          <div key={service} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold capitalize">{service}</div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                {status.status === 'healthy' ? '✓' : '✗'} {status.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">{status.message}</div>
            {status.responseTime !== null && (
              <div className="text-sm text-gray-500 mt-2">
                Response time: {status.responseTime}ms
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
