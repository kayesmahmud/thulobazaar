'use client';

import { useRouter } from 'next/navigation';

interface HeroHeaderProps {
  lang: string;
}

export function HeroHeader({ lang }: HeroHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push(`/${lang}/dashboard`)}
          className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-all hover:gap-3 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span className="text-2xl">🎯</span>
            <span className="font-semibold">Verification Center</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Build Trust, Grow Faster
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Get verified and unlock premium features that help you sell more and build credibility
          </p>
        </div>
      </div>
    </div>
  );
}
