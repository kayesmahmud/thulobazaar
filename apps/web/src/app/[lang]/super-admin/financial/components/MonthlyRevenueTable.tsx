'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { financialFetch } from '../api';
import { formatCurrency, formatMonth, type MonthlyReport } from '../types';

/**
 * All-time month-by-month purchase history.
 * Deliberately ignores the page's period filter — the whole point is to see
 * every month at once, including months whose purchases have long expired.
 */
export default function MonthlyRevenueTable({ lang }: { lang: string }) {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    financialFetch<MonthlyReport>('/api/editor/financial/monthly')
      .then(data => { if (!cancelled) setReport(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Monthly Purchase History</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            All time · money received (verified payments only) · Nepal time · survives ad and
            account deletion
          </p>
        </div>
        <Link
          href={`/${lang}/super-admin/financial/customers`}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline whitespace-nowrap"
        >
          View all customers →
        </Link>
      </div>

      {loading && <div className="px-6 py-8 text-center text-gray-500">Loading history…</div>}
      {error && <div className="px-6 py-8 text-center text-red-600">{error}</div>}

      {!loading && !error && report && (
        report.months.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No verified payments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Buyers</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Promotions</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Business verif. (paid)</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Individual verif. (paid)</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.months.map(m => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {formatMonth(m.month)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{m.buyers}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{m.promotions}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{m.businessVerifications}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{m.individualVerifications}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatCurrency(m.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">All time</div>
                    <div className="text-sm text-gray-600">{report.totals.purchases} purchases</div>
                  </td>
                  <td className="px-6 py-4" />
                  <td className="px-6 py-4" />
                  <td className="px-6 py-4" />
                  <td className="px-6 py-4" />
                  <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                    {formatCurrency(report.totals.revenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}
    </div>
  );
}
