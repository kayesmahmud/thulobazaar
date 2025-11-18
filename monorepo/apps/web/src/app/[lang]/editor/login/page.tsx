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
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-emerald-900 to-teal-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <Link href={`/${lang}`} className="inline-block group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                <h1 className="relative text-5xl font-black text-white tracking-tight">
                  Thulobazaar
                </h1>
              </div>
            </Link>
          </div>

          {/* Main card */}
          <div className="relative">
            {/* Card glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>

            {/* Card content */}
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
              {/* Header with icon */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/50 mb-6 relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                  <svg className="w-10 h-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Editor Portal</h2>
                <p className="text-teal-200">Content moderation and review access</p>
              </div>

              {/* Login form */}
              <EditorLoginForm lang={lang} />

              {/* Security badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-teal-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>256-bit SSL Encrypted Connection</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href={`/${lang}`}
              className="inline-flex items-center gap-2 text-teal-200 hover:text-white transition-colors duration-200 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-sm text-teal-300/60">
            <p>&copy; {new Date().getFullYear()} Thulobazaar. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
