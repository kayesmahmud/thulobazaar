'use client';

import type { SystemHealthData } from '../types';

interface DatabaseHealthProps {
  databaseHealth: SystemHealthData['databaseHealth'];
}

export default function DatabaseHealth({ databaseHealth }: DatabaseHealthProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Database Health</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Connection Pool</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Connections:</span>
              <span className="font-semibold">{databaseHealth.connections.total_connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-green-600">{databaseHealth.connections.active_connections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Idle:</span>
              <span className="font-semibold text-gray-500">{databaseHealth.connections.idle_connections}</span>
            </div>
          </div>
        </div>

        {/* Database Size */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Storage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Database Size:</span>
              <span className="font-semibold">{databaseHealth.databaseSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slow Queries:</span>
              <span className={`font-semibold ${typeof databaseHealth.slowQueries === 'number' && databaseHealth.slowQueries > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {databaseHealth.slowQueries}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tables */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mt-4">
        <h3 className="font-semibold text-gray-900 mb-4">Largest Tables</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm font-semibold text-gray-700">Table</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Size</th>
              </tr>
            </thead>
            <tbody>
              {databaseHealth.topTables.map((table, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="py-2 text-sm text-gray-900">{table.tablename}</td>
                  <td className="py-2 text-sm text-gray-600 text-right font-mono">{table.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
