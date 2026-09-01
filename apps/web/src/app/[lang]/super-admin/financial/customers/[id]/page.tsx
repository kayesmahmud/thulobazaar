'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { financialFetch } from '../../api';
import {
  formatCurrency,
  formatDate,
  formatPaymentType,
  type CustomerDetail,
  type CustomerVerification,
} from '../../types';

/**
 * Fields the API is growing. Deployed builds may not return them yet, so every
 * one is optional here and guarded at the use site.
 */
type CustomerDetailWithHistory = CustomerDetail & {
  customer: { shopSlug?: string | null };
  verifications?: CustomerVerification[];
  excludedFromReports?: boolean;
};

function Pill({ tone, children }: { tone: 'green' | 'gray' | 'red' | 'amber'; children: React.ReactNode }) {
  const tones = {
    green: 'bg-green-100 text-green-700',
    gray: 'bg-gray-100 text-gray-600',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function CustomerHistoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, logout } = useStaffAuth();

  const [detail, setDetail] = useState<CustomerDetailWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    financialFetch<CustomerDetailWithHistory>(`/api/editor/financial/customers/${params.id}`)
      .then(d => { if (!cancelled) setDetail(d); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  };

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName}
      userEmail={staff?.email}
      navSections={getSuperAdminNavSections(params.lang)}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <Link
          href={`/${params.lang}/super-admin/financial/customers`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to customers
        </Link>

        {loading && <div className="py-10 text-center text-gray-500">Loading purchase history…</div>}
        {error && <div className="py-10 text-center text-red-600">{error}</div>}

        {!loading && !error && detail && (
          <>
            {detail.excludedFromReports === true && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-6 py-4 text-sm font-medium">
                This account is excluded from financial reports (marked as a test account).
              </div>
            )}

            {/* Identity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900">{detail.customer.fullName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {detail.customer.phone && (
                  <a
                    href={`tel:${detail.customer.phone}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-sm font-medium text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800"
                  >
                    Call {detail.customer.phone}
                  </a>
                )}
                {detail.customer.email && (
                  <a
                    href={`mailto:${detail.customer.email}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-sm font-medium text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800"
                  >
                    {detail.customer.email}
                  </a>
                )}
                {detail.customer.shopSlug && (
                  <Link
                    href={`/${params.lang}/shop/${detail.customer.shopSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800"
                  >
                    View public profile ↗
                  </Link>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                {detail.customer.businessName && <span>{detail.customer.businessName}</span>}
                <span>Joined {formatDate(detail.customer.joinedAt)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Total Spent</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(detail.summary.totalSpent)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Purchases</div>
                  <div className="text-xl font-bold text-gray-900">{detail.summary.totalPurchases}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Abandoned</div>
                  <div className="text-xl font-bold text-amber-600">{detail.summary.abandonedCheckouts}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Failed</div>
                  <div className="text-xl font-bold text-red-600">{detail.summary.failedPayments}</div>
                </div>
              </div>
            </div>

            {/* Verification badges */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Verification Badges</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Business</span>
                    {(() => {
                      // Never print a raw DB status inside a tone that asserts
                      // meaning — 'pending'/'rejected' used to render green.
                      // Those are checked before `expired` so a re-application
                      // over a lapsed badge reads "Pending", not "Expired".
                      const s = detail.badges.business.status;
                      if (s === 'none') return <Pill tone="gray">Never applied</Pill>;
                      if (s === 'pending') return <Pill tone="amber">Pending</Pill>;
                      if (s === 'rejected') return <Pill tone="red">Rejected</Pill>;
                      if (detail.badges.business.expired) return <Pill tone="red">Expired</Pill>;
                      if (s === 'approved' || s === 'verified') return <Pill tone="green">Active</Pill>;
                      return <Pill tone="gray">{formatPaymentType(s)}</Pill>;
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Verified: {formatDate(detail.badges.business.verifiedAt)}<br />
                    Expires: {formatDate(detail.badges.business.expiresAt)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Individual</span>
                    {!detail.badges.individual.verified ? (
                      <Pill tone="gray">Not verified</Pill>
                    ) : detail.badges.individual.expired ? (
                      <Pill tone="red">Expired</Pill>
                    ) : (
                      <Pill tone="green">Active</Pill>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Verified: {formatDate(detail.badges.individual.verifiedAt)}<br />
                    Expires: {formatDate(detail.badges.individual.expiresAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification history */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Verification History</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Every badge ever granted — most were granted free, not sold
                </p>
              </div>
              {(detail.verifications ?? []).length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No verifications.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name on document</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verified</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expires</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(detail.verifications ?? []).map(v => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            {v.type === 'business' ? (
                              <Pill tone="amber">Business</Pill>
                            ) : (
                              <Pill tone="gray">Individual</Pill>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            <span className="block max-w-[16rem] truncate" title={v.label}>
                              {v.label || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(v.verifiedAt)}</td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(v.expiresAt)}</td>
                          <td className="px-6 py-4 text-center">
                            {v.superseded ? (
                              <Pill tone="gray">Superseded</Pill>
                            ) : !v.expiresAt ? (
                              <Pill tone="gray">No expiry</Pill>
                            ) : v.expired ? (
                              <Pill tone="red">Expired</Pill>
                            ) : (
                              <Pill tone="green">Active</Pill>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {v.paymentStatus === 'paid' ? (
                              <span className="font-semibold text-gray-900">{formatCurrency(v.amount)}</span>
                            ) : v.paymentStatus === 'free' ? (
                              <Pill tone="gray">Free</Pill>
                            ) : (
                              <span className="inline-flex items-center gap-2 justify-end">
                                {v.amount > 0 && (
                                  <span className="text-gray-900">{formatCurrency(v.amount)}</span>
                                )}
                                <Pill tone="gray">
                                  {v.paymentStatus === 'pending' ? 'Pending' : v.paymentStatus}
                                </Pill>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Promotions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Ad Promotions</h3>
                <p className="text-sm text-gray-500 mt-0.5">Including expired — this is the full history</p>
              </div>
              {detail.promotions.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No promotions.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ad</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Started</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expires</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detail.promotions.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 max-w-xs">
                            <div className="truncate font-medium text-gray-900" title={p.adTitle}>
                              {p.adTitle}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 capitalize whitespace-nowrap">
                            {p.type} · {p.durationDays}d
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(p.startsAt)}</td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(p.expiresAt)}</td>
                          <td className="px-6 py-4 text-center">
                            {p.expired ? <Pill tone="gray">Expired</Pill> : <Pill tone="green">Active</Pill>}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            {p.comped ? (
                              <Pill tone="amber">Comped</Pill>
                            ) : (
                              <span className="font-semibold text-gray-900">{formatCurrency(p.pricePaid)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Payment Attempts</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Only <strong>verified</strong> rows are money received; pending means the checkout was abandoned
                </p>
              </div>
              {detail.payments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No payments.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">For</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Gateway</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detail.payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                          <td className="px-6 py-4 text-gray-900">{formatPaymentType(p.type)}</td>
                          <td className="px-6 py-4 text-gray-600 capitalize">{p.gateway}</td>
                          <td className="px-6 py-4 text-center">
                            {p.status === 'verified' ? (
                              <Pill tone="green">Paid</Pill>
                            ) : p.status === 'failed' ? (
                              <Pill tone="red">Failed</Pill>
                            ) : (
                              <Pill tone="amber">Abandoned</Pill>
                            )}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${
                              p.status === 'verified' ? 'text-gray-900' : 'text-gray-400'
                            }`}
                          >
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
