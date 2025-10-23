import { redirect } from 'next/navigation';

interface SellerProfilePageProps {
  params: Promise<{ lang: string; sellerSlug: string }>;
}

/**
 * DEPRECATED: This route redirects to the shop page.
 * All users now use /shop/:slug regardless of verification status.
 */
export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const { lang, sellerSlug } = await params;

  // Redirect to shop page - everyone uses /shop/:slug now
  redirect(`/${lang}/shop/${sellerSlug}`);
}
