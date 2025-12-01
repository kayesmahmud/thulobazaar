import { Metadata } from 'next';
import Link from 'next/link';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Register - Thulobazaar',
  description: 'Create your Thulobazaar account',
};

interface RegisterPageProps {
  params: Promise<{ lang: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-rose-500">Thulobazaar</h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
          <p className="text-gray-500">Join Thulobazaar to buy and sell easily</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
          <RegisterForm lang={lang} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              href={`/${lang}/auth/signin`}
              className="inline-block w-full px-4 py-2 rounded-lg font-semibold border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
            >
              Login instead
            </Link>
          </div>
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
