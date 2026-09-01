'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { financialFetch } from '../api';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  formatPaymentType,
  type PromotionRow,
  type PromotionsResponse,
} from '../types';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const ALL_MONTHS = '';

function StatusPill({ status }: { status: PromotionRow['status'] }) {
  // Text always carries the state; colour is reinforcement only.
  switch (status) {
    case 'active':
      return (
        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 whitespace-nowrap">
          Active
        </span>
      );
    case 'ended':
      return (
        <span
          className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 whitespace-nowrap"
          title="Replaced or deactivated before its expiry"
        >
          Ended early
        </span>
      );
    case 'expired':
      return (
        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
          Expired
        </span>
      );
    case 'removed':
      return (
        <span
          className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 whitespace-nowrap"
          title="The ad was deleted before this promotion expired, taking the promotion with it"
        >
          Ad deleted
        </span>
      );
    default:
      return (
        <span
          className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500 whitespace-nowrap"
          title="No promotion dates on record — paid but never provisioned"
        >
          Unknown
        </span>
      );
  }
}

function PaidCell({ row }: { row: PromotionRow }) {
  switch (row.paymentStatus) {
    case 'comped':
      return (
        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
          Comped
        </span>
      );
    case 'unpaid':
      return (
        <span
          className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700"
          title="A price was recorded but no verified payment exists"
        >
          Unpaid
        </span>
      );
    default:
      return <span className="font-bold text-gray-900">{formatCurrency(row.pricePaid)}</span>;
  }
}

/**
 * Every ad promotion ever bought, month by month.
 * Expired rows are the point of this view — the owner uses it to find lapsed
 * customers and call them — so they are always shown, never filtered out.
 */
export default function PromotionsTab({ lang }: { lang: string }) {
  const [data, setData] = useState<PromotionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState<string>(ALL_MONTHS);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (month) query.set('month', month);
    if (debouncedSearch) query.set('search', debouncedSearch);

    financialFetch<PromotionsResponse>(`/api/editor/financial/promotions?${query}`)
      .then(result => {
        if (id !== requestId.current) return; // a newer request already won
        setData(result);
        setLoading(false);
        // Stranded page: a filter change (or a deleted row) can leave `page`
        // past the last page — snap back to the first one.
        if (result.rows.length === 0 && page > 1) setPage(1);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        // Keep the previous data so the month dropdown survives a failed refetch.
        setError(err instanceof Error ? err.message : 'Failed to load promotions');
        setLoading(false);
      });
  }, [month, debouncedSearch, page]);

  // The months aggregate is unfiltered server-side, so the dropdown can never
  // empty out when a filter narrows the rows.
  const months = data?.months ?? [];

  const summary = useMemo(() => {
    const rows = month ? months.filter(m => m.month === month) : months;
    return rows.reduce(
      (acc, m) => ({
        purchases: acc.purchases + m.purchases,
        buyers: acc.buyers + m.buyers,
        revenue: acc.revenue + m.revenue,
      }),
      { purchases: 0, buyers: 0, revenue: 0 }
    );
  }, [months, month]);

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setPage(1);
  };

  const rows = data?.rows ?? [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Promotions Purchased</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Every ad promotion ever bought — expired ones included; survives ad and account deletion
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={e => handleMonthChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={ALL_MONTHS}>All months</option>
            {months.map(m => (
              <option key={m.month} value={m.month}>
                {`${formatMonth(m.month, 'short')} — ${m.purchases} purchases · ${m.buyers} buyers`}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone or email…"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Purchases</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{summary.purchases}</div>
          </div>
          {/* Only shown for a single month: `buyers` is a per-month DISTINCT count,
              and distinct counts are not additive — summing them across months
              would count a repeat buyer once per month they bought in. */}
          {month && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Buyers</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{summary.buyers}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(summary.revenue)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Period</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">
              {month ? formatMonth(month, 'short') : 'All months'}
            </div>
          </div>
        </div>
        {/* The counts above come from the month aggregate, which ignores the
            search box — so say how many rows actually match once it is active. */}
        {debouncedSearch && pagination && (
          <div className="mt-3 text-sm text-gray-600">
            Matching rows: <span className="font-bold text-gray-900">{pagination.total}</span>
            <span className="text-gray-400"> (counts above ignore the search)</span>
          </div>
        )}
      </div>

      {/* Only the very first load collapses the card; a refetch dims the existing
          rows in place so the table and the pagination buttons never move out
          from under the cursor mid-click. */}
      {loading && !data && (
        <div className="px-6 py-10 text-center text-gray-500">Loading promotions…</div>
      )}
      {error && <div className="px-6 py-10 text-center text-red-600">{error}</div>}
      {!error && !loading && rows.length === 0 && (
        <div className="px-6 py-10 text-center text-gray-500">
          No promotions found for this filter.
        </div>
      )}

      {!error && rows.length > 0 && (
        <div
          className={`overflow-x-auto transition-opacity ${
            loading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ad</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Promotion</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Purchased</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expires</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 align-top">
                  <td className="px-6 py-4">
                    <Link
                      href={`/${lang}/super-admin/financial/customers/${row.userId}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {row.userName}
                    </Link>
                    {row.accountDeleted && (
                      <div className="mt-0.5">
                        <span
                          className="inline-block px-1.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600"
                          title="The account was deleted; contact details are from the purchase record"
                        >
                          Account deleted
                        </span>
                      </div>
                    )}
                    <div className="text-sm mt-0.5">
                      {row.userPhone ? (
                        <a
                          href={`tel:${row.userPhone}`}
                          className="text-gray-600 hover:text-indigo-600 hover:underline"
                        >
                          {row.userPhone}
                        </a>
                      ) : row.userEmail ? (
                        <a
                          href={`mailto:${row.userEmail}`}
                          className="text-gray-500 hover:text-indigo-600 hover:underline"
                        >
                          {row.userEmail}
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                    {row.shopSlug && !row.accountDeleted && (
                      <Link
                        href={`/${lang}/shop/${row.shopSlug}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        View shop →
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[260px] truncate text-gray-900" title={row.adTitle}>
                      {row.adTitle}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      {row.adId !== null && <span>Ad #{row.adId}</span>}
                      {row.adDeleted && (
                        <span
                          className="inline-block px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold"
                          title="The ad was deleted; this purchase is kept from the purchase record"
                        >
                          ad deleted
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {formatPaymentType(row.type)}
                    {row.durationDays !== null && ` · ${row.durationDays}d`}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(row.purchasedAt)}</td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(row.expiresAt)}</td>
                  <td className="px-6 py-4">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaidCell row={row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600" aria-live="polite">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
