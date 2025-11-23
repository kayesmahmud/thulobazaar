import { redirect } from 'next/navigation';

export default async function SuperAdminRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/super-admin/dashboard`);
}
