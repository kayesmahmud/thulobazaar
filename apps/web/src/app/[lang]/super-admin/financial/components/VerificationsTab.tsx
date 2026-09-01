'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { financialFetch } from '../api';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  type VerificationRow,
  type VerificationsResponse,
} from '../types';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

type TypeFilter = '' | 'business' | 'individual';

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' },
];

function TypePill({ type }: { type: VerificationRow['type'] }) {
  const isBusiness = type === 'business';
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
        isBusiness ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
      }`}
    >
      {isBusiness ? 'Business' : 'Individual'}
    </span>
  );
}

function StatusPill({ row }: { row: VerificationRow }) {
  // An older grant of the same badge: the live badge is described by a newer row,
  // so this one makes no Active/Expired claim.
  if (row.superseded) {
    return (
      <span
        className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 whitespace-nowrap"
        title="Replaced by a later verification for this customer"
      >
        Superseded
      </span>
    );
  }
  // Revoke clears the expiry, so this must come before the "No expiry" branch
  // or a revoked badge would read as a permanent one.
  if (row.revoked) {
    return (
      <span
        className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 whitespace-nowrap"
        title="Badge revoked by staff"
      >
        Revoked
      </span>
    );
  }
  if (!row.expiresAt) {
    return (
      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
        No expiry
      </span>
    );
  }
  return row.expired ? (
    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 whitespace-nowrap">
      Expired
    </span>
  ) : (
    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 whitespace-nowrap">
      Active
    </span>
  );
}

/**
 * Every verification badge ever granted — business and individual.
 * Most rows were granted free, so this is a history of badges, not a sales list.
 */
export default function VerificationsTab({ lang }: { lang: string }) {
  const [data, setData] = useState<VerificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState('');
  const [type, setType] = useState<TypeFilter>('');
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
    if (type) query.set('type', type);
    if (debouncedSearch) query.set('search', debouncedSearch);

    financialFetch<VerificationsResponse>(`/api/editor/financial/verifications?${query}`)
      .then(result => {
        if (id !== requestId.current) return; // stale response — a newer request is in flight
        setData(result);
        // Stranded page: a filter change (or a deleted row) can leave `page`
        // past the last page — snap back to the first one.
        if (result.rows.length === 0 && page > 1) setPage(1);
      })
      .catch(err => {
        if (id !== requestId.current) return;
        // Keep the previous data so the month dropdown survives a failed refetch.
        setError(err instanceof Error ? err.message : 'Failed to load verifications');
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
  }, [month, type, debouncedSearch, page]);

  // The months aggregate is unfiltered server-side, so the dropdown can never
  // empty out when a filter narrows the rows.
  const months = data?.months ?? [];

  const summary = useMemo(() => {
    const source = month ? months.filter(m => m.month === month) : months;
    return source.reduce(
      (acc, m) => ({
        business: acc.business + m.business,
        individual: acc.individual + m.individual,
        revenue: acc.revenue + m.revenue,
      }),
      { business: 0, individual: 0, revenue: 0 }
    );
  }, [months, month]);

  const rows = data?.rows ?? [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Verifications</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Every business and individual badge ever granted. Badges granted free of charge are
          included and marked &ldquo;Free&rdquo; — this is a history of verifications, not of sales.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <select
            value={month}
            onChange={e => {
              setMonth(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All months</option>
            {months.map(m => (
              <option key={m.month} value={m.month}>
                {`${formatMonth(m.month, 'short')} — ${m.business} business · ${m.individual} individual`}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            {TYPE_FILTERS.map(option => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => {
                  setType(option.value);
                  setPage(1);
                }}
                className={`px-3 py-2 text-sm font-medium border-r border-gray-300 last:border-r-0 ${
                  type === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email or business…"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-4 text-sm">
          <span className="text-gray-600">
            <span className="font-bold text-gray-900">{summary.business}</span> business
          </span>
          <span className="text-gray-600">
            <span className="font-bold text-gray-900">{summary.individual}</span> individual
          </span>
          <span className="text-gray-600">
            <span className="font-bold text-gray-900">{summary.business + summary.individual}</span>{' '}
            total {month ? `in ${formatMonth(month, 'short')}` : 'all time'}
          </span>
          <span className="text-gray-600">
            Paid: <span className="font-bold text-gray-900">{formatCurrency(summary.revenue)}</span>
          </span>
          {/* The counts above come from the month aggregate, which ignores the
              search box and the type toggle — so say how many rows actually
              match once either is active. `month` is already reflected above. */}
          {(debouncedSearch || type) && pagination && (
            <span className="text-gray-600">
              Matching rows: <span className="font-bold text-gray-900">{pagination.total}</span>
              <span className="text-gray-400"> (counts above ignore search and type)</span>
            </span>
          )}
        </div>
      </div>

      {/* Only the very first load collapses the card; a refetch dims the existing
          rows in place so the table and the pagination buttons never move out
          from under the cursor mid-click. */}
      {loading && !data && (
        <div className="px-6 py-10 text-center text-gray-500">Loading verifications…</div>
      )}
      {error && <div className="px-6 py-10 text-center text-red-600">{error}</div>}
      {!error && !loading && rows.length === 0 && (
        <div className="px-6 py-10 text-center text-gray-500">
          No verifications match these filters.
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Name on document
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verified</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expires</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/${lang}/super-admin/financial/customers/${row.userId}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {row.userName}
                    </Link>
                    <div className="text-sm text-gray-500">
                      {row.userPhone ? (
                        <a href={`tel:${row.userPhone}`} className="hover:text-indigo-600 hover:underline">
                          {row.userPhone}
                        </a>
                      ) : (
                        row.userEmail || '—'
                      )}
                      {row.shopSlug && (
                        <>
                          {' · '}
                          <Link
                            href={`/${lang}/shop/${row.shopSlug}`}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            Shop
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TypePill type={row.type} />
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <span className="block max-w-[16rem] truncate" title={row.label}>
                      {row.label || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {formatDate(row.verifiedAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {formatDate(row.expiresAt)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill row={row} />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {row.paymentStatus === 'paid' ? (
                      <span className="font-bold text-gray-900">{formatCurrency(row.amount)}</span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        {row.paymentStatus === 'free' ? 'Free' : row.paymentStatus === 'pending' ? 'Pending' : row.paymentStatus}
                      </span>
                    )}
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
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} verifications
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
