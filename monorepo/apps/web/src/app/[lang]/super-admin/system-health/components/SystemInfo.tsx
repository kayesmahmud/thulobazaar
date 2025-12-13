'use client';

import type { SystemHealthData } from '../types';
import { formatUptime } from '../types';

interface SystemInfoProps {
  systemInfo: SystemHealthData['systemInfo'];
}

export default function SystemInfo({ systemInfo }: SystemInfoProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-600">Node Version</div>
          <div className="font-semibold">{systemInfo.nodeVersion}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Platform</div>
          <div className="font-semibold">{systemInfo.platform}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Uptime</div>
          <div className="font-semibold">{formatUptime(systemInfo.uptime)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Memory (Heap Used)</div>
          <div className="font-semibold">{systemInfo.memoryUsage.heapUsed}</div>
        </div>
      </div>
    </div>
  );
}
