/**
 * Scam Prevention
 * /[lang]/scam-prevention - how the advance-payment scam works, the warning
 * signs, and where to file a complaint with Nepal Police.
 */

import { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import ScriptTabs from '@/components/ui/ScriptTabs';
import {
  AlertTriangle,
  ExternalLink,
  Mail,
  MessageSquareWarning,
  Phone,
  ShieldCheck,
  Siren,
  Store,
} from 'lucide-react';

const POLICE_COMPLAINT_FORM_URL = 'https://kvcio.nepalpolice.gov.np/ujuri-gunaso-form/';
const CYBER_BUREAU_EMAIL = 'cyberbureau@nepalpolice.gov.np';
const CYBER_BUREAU_PHONE = '01-5319044';
const POLICE_EMERGENCY_NUMBER = '100';

interface ScamPreventionPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: ScamPreventionPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thulobazaar.com.np';
  const title = t('scamPreventionTitle');
  const description = t('scamPreventionDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/scam-prevention`,
      siteName: 'Thulo Bazaar',
      locale: lang === 'ne' ? 'ne_NP' : 'en_US',
      type: 'website',
    },
    alternates: {
      canonical: `${baseUrl}/${lang}/scam-prevention`,
      languages: {
        en: `${baseUrl}/en/scam-prevention`,
        ne: `${baseUrl}/ne/scam-prevention`,
        'x-default': `${baseUrl}/en/scam-prevention`,
      },
    },
  };
}

type Suffix = '' | 'Latin';

const numbered = (prefix: string, count: number, suffix: Suffix) =>
  Array.from({ length: count }, (_, i) => `${prefix}${i + 1}${suffix}`);

export default async function ScamPreventionPage({ params }: ScamPreventionPageProps) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'scamPrevention' });
  const tc = await getTranslations({ locale: lang, namespace: 'common' });

  const hero = (suffix: Suffix) => (
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-16 text-center">
          <div className="flex justify-center mb-5">
            <span className="safety-beacon safety-beacon--light safety-beacon--lg" aria-hidden="true">
              <ShieldCheck className="w-7 h-7" />
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">{t(`title${suffix}`)}</h1>
          <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto">{t(`subtitle${suffix}`)}</p>
        </div>
      </div>
  );

  const body = (suffix: Suffix) => (
      <div className="max-w-3xl mx-auto px-4 pb-8 md:pb-12 space-y-6">
        <Section icon={<MessageSquareWarning className="w-5 h-5" />} tint="bg-red-100 text-red-700" title={t(`howTitle${suffix}`)}>
          <p className="text-gray-700 leading-relaxed">{t(`howStory${suffix}`)}</p>
        </Section>

        <Section icon={<AlertTriangle className="w-5 h-5" />} tint="bg-orange-100 text-orange-700" title={t(`redFlagsTitle${suffix}`)}>
          <BulletList items={numbered('redFlag', 6, suffix).map((k) => t(k))} marker="bg-orange-500" />
        </Section>

        <Section icon={<ShieldCheck className="w-5 h-5" />} tint="bg-green-100 text-green-700" title={t(`buyerRulesTitle${suffix}`)}>
          <BulletList items={numbered('buyerRule', 6, suffix).map((k) => t(k))} marker="bg-green-500" />
        </Section>

        <Section icon={<Store className="w-5 h-5" />} tint="bg-blue-100 text-blue-700" title={t(`sellerRulesTitle${suffix}`)}>
          <BulletList items={numbered('sellerRule', 3, suffix).map((k) => t(k))} marker="bg-blue-500" />
        </Section>

        <Section icon={<Siren className="w-5 h-5" />} tint="bg-red-100 text-red-700" title={t(`scammedTitle${suffix}`)}>
          <p className="text-gray-700 leading-relaxed mb-4">{t(`scammedIntro${suffix}`)}</p>
          <ol className="space-y-3">
            {numbered('scammedStep', 4, suffix).map((k, i) => (
              <li key={k} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-gray-700 leading-relaxed pt-0.5">{t(k)}</span>
              </li>
            ))}
          </ol>
        </Section>

        <section className="bg-white rounded-2xl border-2 border-blue-200 p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <Image
              src="/nepal-police-logo.png"
              alt="Nepal Police"
              width={56}
              height={53}
              className="flex-shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t(`policeTitle${suffix}`)}</h2>
              <p className="text-sm text-gray-500">{t(`policeOffice${suffix}`)}</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed mb-5">{t(`policeBody${suffix}`)}</p>
          <a
            href={POLICE_COMPLAINT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors"
          >
            {t(`policeButton${suffix}`)}
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-sm text-gray-600 leading-relaxed mt-5">{t(`policeOutsideValley${suffix}`)}</p>
          <ul className="mt-4 space-y-2">
            <ContactRow icon={<Mail className="w-4 h-4" />} label={t(`cyberBureauEmail${suffix}`)} value={CYBER_BUREAU_EMAIL} href={`mailto:${CYBER_BUREAU_EMAIL}`} />
            <ContactRow icon={<Phone className="w-4 h-4" />} label={t(`cyberBureauPhone${suffix}`)} value={CYBER_BUREAU_PHONE} href={`tel:${CYBER_BUREAU_PHONE.replace('-', '')}`} />
            <ContactRow icon={<Siren className="w-4 h-4" />} label={t(`policeEmergency${suffix}`)} value={POLICE_EMERGENCY_NUMBER} href={`tel:${POLICE_EMERGENCY_NUMBER}`} />
          </ul>
          <p className="text-xs text-gray-500 mt-5">{t(`policeDisclaimer${suffix}`)}</p>
        </section>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ScriptTabs
        enabled={lang === 'en'}
        align="center"
        englishLabel={tc('scriptTabEnglish')}
        romanLabel={tc('scriptTabRoman')}
        en={{ top: hero(''), content: body('') }}
        roman={{ top: hero('Latin'), content: body('Latin') }}
      />
    </div>
  );
}

function Section({
  icon,
  tint,
  title,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tint}`}>{icon}</span>
        <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BulletList({ items, marker }: { items: string[]; marker: string }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-2.5 ${marker}`} />
          <span className="text-gray-700 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-600">{label}:</span>
      <a href={href} className="font-medium text-blue-700 hover:underline break-all min-h-[44px] inline-flex items-center">
        {value}
      </a>
    </li>
  );
}
