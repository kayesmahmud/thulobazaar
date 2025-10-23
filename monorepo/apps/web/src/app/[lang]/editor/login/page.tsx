import { Metadata } from 'next';
import Link from 'next/link';
import EditorLoginForm from './EditorLoginForm';

export const metadata: Metadata = {
  title: 'Editor Login - Thulobazaar',
  description: 'Editor login for Thulobazaar',
};

interface EditorLoginPageProps {
  params: Promise<{ lang: string }>;
}

export default async function EditorLoginPage({ params }: EditorLoginPageProps) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col justify-center py-12 px-4 tablet:px-6 laptop:px-8">
      <div className="tablet:mx-auto tablet:w-full tablet:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-primary">Thulobazaar</h1>
          </Link>
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <span className="text-4xl text-white">✍️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Editor Portal</h2>
          <p className="text-muted">Content moderation access</p>
        </div>

        {/* Login Form Card */}
        <div className="card-elevated">
          <EditorLoginForm lang={lang} />

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
            <Link href={`/${lang}/super-admin/login`} className="btn-outline-primary text-center">
              Super Admin Login
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
