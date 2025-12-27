import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header, Footer, BottomNav } from '@/components/layout';
import GoogleAdSense from '@/components/ads/GoogleAdSense';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';
import InstallPrompt from '@/components/pwa/InstallPrompt';

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
    manifest: '/manifest.json',
    themeColor: '#6366f1',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'ThuluBazaar',
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false, // Prevents zooming on mobile inputs
    },
    icons: {
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/icons/apple-touch-icon.png',
    },
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
      <ServiceWorkerRegister />
      <InstallPrompt />
      <GoogleAdSense />
      <Header lang={lang} />
      <div className="pb-20 lg:pb-0">
        {children}
      </div>
      <Footer lang={lang} />
      <BottomNav lang={lang} />
    </>
  );
}
