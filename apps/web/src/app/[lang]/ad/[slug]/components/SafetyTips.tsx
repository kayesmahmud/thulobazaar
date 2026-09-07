import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import ScriptTabs from '@/components/ui/ScriptTabs';

type Suffix = '' | 'Latin';

export async function SafetyTips() {
  const t = await getTranslations('ads');
  const tc = await getTranslations('common');
  const locale = await getLocale();

  const header = (suffix: Suffix) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <span className="safety-beacon" aria-hidden="true">
        <ShieldAlert style={{ width: '20px', height: '20px' }} />
      </span>
      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#9a3412' }}>
        {t(`safetyTips${suffix}`)}
      </h4>
    </div>
  );

  const body = (suffix: Suffix) => (
    <>
      <ul style={{ fontSize: '0.875rem', color: '#78350f', lineHeight: '1.5' }} className="space-y-2 mt-4">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center"
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span>{t(`safetyTip${n}${suffix}`)}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/${locale}/scam-prevention`}
        className="flex items-center justify-center gap-2 w-full min-h-[48px] mt-5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors"
      >
        <ShieldCheck className="w-4.5 h-4.5" />
        {t(`safetyLearnMore${suffix}`)}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </>
  );

  return (
    <div style={{
      background: '#fff7ed',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #fed7aa'
    }}>
      <ScriptTabs
        enabled={locale === 'en'}
        englishLabel={tc('scriptTabEnglish')}
        romanLabel={tc('scriptTabRoman')}
        en={{ top: header(''), content: body('') }}
        roman={{ top: header('Latin'), content: body('Latin') }}
      />
    </div>
  );
}
