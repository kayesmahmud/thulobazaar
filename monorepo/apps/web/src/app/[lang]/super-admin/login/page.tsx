import { Metadata } from 'next';
import Link from 'next/link';
import SuperAdminLoginForm from './SuperAdminLoginForm';

export const metadata: Metadata = {
  title: 'Super Admin Login - Thulobazaar',
  description: 'Super Admin login for Thulobazaar',
};

interface SuperAdminLoginPageProps {
  params: Promise<{ lang: string }>;
}

export default async function SuperAdminLoginPage({ params }: SuperAdminLoginPageProps) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 px-4 tablet:px-6 laptop:px-8">
      <div className="tablet:mx-auto tablet:w-full tablet:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-primary">Thulobazaar</h1>
          </Link>
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-4xl text-white">🛡️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Portal</h2>
          <p className="text-muted">Secure super admin access</p>
        </div>

        {/* Login Form Card */}
        <div className="card-elevated">
          <SuperAdminLoginForm lang={lang} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted">Other login options</span>
            </div>
          </div>

          {/* Other Login Links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/${lang}/editor/login`} className="btn-outline-primary text-center">
              Editor Login
            </Link>
            <Link href={`/${lang}/auth/login`} className="btn-outline-primary text-center">
              User Login
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-muted">
          <Link href={`/${lang}`} className="link">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
