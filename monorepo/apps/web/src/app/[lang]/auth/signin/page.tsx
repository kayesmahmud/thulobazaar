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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="inline-block mb-6">
            <span className="text-4xl font-bold text-rose-500">Thulobazaar</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500">Login to your account to continue</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-md p-8">
          <LoginForm lang={lang} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Don&apos;t have an account?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href={`/${lang}/auth/register`}
            className="block w-full py-3 px-4 text-center rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors duration-200"
          >
            Create an account
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href={`/${lang}`} className="text-rose-500 hover:text-rose-600 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
