import { redirect } from 'next/navigation';

interface ShopIndexPageProps {
  params: Promise<{ lang: string }>;
}

export default async function ShopIndexPage({ params }: ShopIndexPageProps) {
  const { lang } = await params;
  redirect(`/${lang}`);
}
