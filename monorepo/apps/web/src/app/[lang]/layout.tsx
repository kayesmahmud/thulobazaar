import { notFound } from 'next/navigation';
import Header from '../../components/Header';

const supportedLanguages = ['en', 'ne'] as const;
type SupportedLanguage = typeof supportedLanguages[number];

export async function generateStaticParams() {
  return supportedLanguages.map((lang) => ({ lang }));
}

export default async function LanguageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  // Await params in Next.js 15
  const { lang } = await params;

  // Validate language
  if (!supportedLanguages.includes(lang as SupportedLanguage)) {
    notFound();
  }

  return (
    <div lang={lang}>
      <Header lang={lang} />
      {children}
    </div>
  );
}
