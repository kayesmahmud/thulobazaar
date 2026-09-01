'use client';

import { Suspense, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { getSuperAdminNavSections } from '@/lib/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import PromotionsTab from '../components/PromotionsTab';
import VerificationsTab from '../components/VerificationsTab';

type TabKey = 'promotions' | 'verifications';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'promotions', label: 'Promotions' },
  { key: 'verifications', label: 'Verifications' },
];

/**
 * Tab bar + active view. Isolated in its own component so that useSearchParams
 * sits inside the <Suspense> boundary the App Router requires.
 */
function CustomersTabs({ lang }: { lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTab = searchParams?.get('tab');
  const activeTab: TabKey = requestedTab === 'verifications' ? 'verifications' : 'promotions';

  const selectTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    router.replace(`/${lang}/super-admin/financial/customers?tab=${tab}`, { scroll: false });
  };

  return (
    <>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Customer groups">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              aria-current={activeTab === tab.key ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'promotions' ? <PromotionsTab lang={lang} /> : <VerificationsTab lang={lang} />}
    </>
  );
}

export default function FinancialCustomersPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, logout } = useStaffAuth();

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
        <div>
          <Link
            href={`/${params.lang}/super-admin/financial`}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back to Financial
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Financial Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Who bought a promotion and who holds a verification badge — pick a month, then call them.
          </p>
        </div>

        <Suspense
          fallback={<div className="px-6 py-10 text-center text-gray-500">Loading…</div>}
        >
          <CustomersTabs lang={params.lang} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
