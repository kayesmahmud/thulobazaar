'use client';

import { formatCurrency, type FinancialStats } from '../types';

interface SummaryCardsProps {
  summary: FinancialStats['summary'];
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const successRate = summary.totalTransactions > 0
    ? ((summary.totalTransactions / (summary.totalTransactions + summary.failedTransactions.count)) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Revenue */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">💰</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</div>
        <div className="text-sm text-gray-500 mt-1">{summary.totalTransactions} transactions</div>
      </div>

      {/* Pending Transactions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">⏳</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-yellow-600">{formatCurrency(summary.pendingTransactions.amount)}</div>
        <div className="text-sm text-gray-500 mt-1">{summary.pendingTransactions.count} transactions</div>
      </div>

      {/* Failed Transactions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">❌</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-red-600">{formatCurrency(summary.failedTransactions.amount)}</div>
        <div className="text-sm text-gray-500 mt-1">{summary.failedTransactions.count} transactions</div>
      </div>

      {/* Success Rate */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📈</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-blue-600">{successRate}%</div>
        <div className="text-sm text-gray-500 mt-1">Of all transactions</div>
      </div>
    </div>
  );
}
