import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '../../components/Header';
import GoogleAdSense from '@/components/ads/GoogleAdSense';

const supportedLanguages = ['en', 'ne'] as const;
type SupportedLanguage = typeof supportedLanguages[number];

export async function generateStaticParams() {
  return supportedLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: 'ThuluBazaar - Buy & Sell Everything',
    description: lang === 'ne'
      ? 'नेपालको अग्रणी क्लासिफाइड मार्केटप्लेस'
      : "Nepal's Leading Classifieds Marketplace",
  };
}

export default async function LanguageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate language
  if (!supportedLanguages.includes(lang as SupportedLanguage)) {
    notFound();
  }

  return (
    <>
      <GoogleAdSense />
      <Header lang={lang} />
      {children}
    </>
  );
}
