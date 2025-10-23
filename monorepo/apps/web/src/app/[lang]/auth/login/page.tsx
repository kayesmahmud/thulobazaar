import { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Login - Thulobazaar',
  description: 'Login to your Thulobazaar account',
};

interface LoginPageProps {
  params: Promise<{ lang: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 tablet:px-6 laptop:px-8">
      <div className="tablet:mx-auto tablet:w-full tablet:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-primary">Thulobazaar</h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-muted">Login to your account to continue</p>
        </div>

        {/* Login Form Card */}
        <div className="card-elevated">
          <LoginForm lang={lang} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted">Don&apos;t have an account?</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link href={`/${lang}/auth/register`} className="btn-outline-primary w-full">
              Create an account
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
