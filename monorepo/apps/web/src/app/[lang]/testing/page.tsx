import Link from 'next/link';

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          Tailwind CSS Animated Buttons
        </h1>
        <p className="text-gray-400 text-center mb-12">
          All animations are GPU-accelerated CSS - no JavaScript required
        </p>

        {/* Section 1: Gradient Glow Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            1. Gradient Glow Buttons
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Green Glow (Current POST FREE AD style) */}
            <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-bold hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-green-500/50 hover:scale-105">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center gap-2">
                <span>Green Glow</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </button>

            {/* Purple/Pink Glow */}
            <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center gap-2">
                <span>Purple Glow</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </button>

            {/* Blue/Cyan Glow */}
            <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:via-cyan-600 hover:to-teal-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center gap-2">
                <span>Blue Glow</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </button>

            {/* Orange/Yellow Glow */}
            <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-white px-8 py-4 rounded-xl font-bold hover:from-orange-500 hover:via-amber-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-orange-500/50 hover:scale-105">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center gap-2">
                <span>Orange Glow</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </button>
          </div>
        </section>

        {/* Section 2: Pulse & Bounce Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            2. Pulse & Bounce Animations
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Pulse Button */}
            <button className="px-8 py-4 bg-rose-500 text-white rounded-xl font-bold animate-pulse hover:bg-rose-600 transition-colors">
              Pulse Effect
            </button>

            {/* Bounce Button */}
            <button className="px-8 py-4 bg-indigo-500 text-white rounded-xl font-bold animate-bounce hover:bg-indigo-600 transition-colors">
              Bounce Effect
            </button>

            {/* Spin Icon Button */}
            <button className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </button>

            {/* Ping Notification */}
            <button className="relative px-8 py-4 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors">
              Notifications
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center">3</span>
              </span>
            </button>
          </div>
        </section>

        {/* Section 3: Hover Transform Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            3. Hover Transform Effects
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Scale Up */}
            <button className="px-8 py-4 bg-sky-500 text-white rounded-xl font-bold transition-transform duration-300 hover:scale-110">
              Scale Up
            </button>

            {/* Scale Down */}
            <button className="px-8 py-4 bg-fuchsia-500 text-white rounded-xl font-bold transition-transform duration-300 hover:scale-95 active:scale-90">
              Scale Down (Click)
            </button>

            {/* Rotate */}
            <button className="px-8 py-4 bg-lime-500 text-white rounded-xl font-bold transition-transform duration-300 hover:rotate-3">
              Rotate
            </button>

            {/* Translate Y */}
            <button className="px-8 py-4 bg-amber-500 text-white rounded-xl font-bold transition-transform duration-300 hover:-translate-y-2 shadow-lg hover:shadow-xl">
              Lift Up
            </button>

            {/* Skew */}
            <button className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold transition-transform duration-300 hover:skew-x-3">
              Skew
            </button>
          </div>
        </section>

        {/* Section 4: Border & Outline Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            4. Border & Outline Effects
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Border Grow */}
            <button className="px-8 py-4 bg-transparent text-white rounded-xl font-bold border-2 border-white/30 hover:border-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Border Glow
            </button>

            {/* Ring Effect */}
            <button className="px-8 py-4 bg-cyan-500 text-white rounded-xl font-bold transition-all duration-300 hover:ring-4 hover:ring-cyan-300 hover:ring-offset-2 hover:ring-offset-gray-900">
              Ring Effect
            </button>

            {/* Outline Offset */}
            <button className="px-8 py-4 bg-pink-500 text-white rounded-xl font-bold transition-all duration-300 outline outline-2 outline-transparent hover:outline-pink-300 hover:outline-offset-4">
              Outline Offset
            </button>

            {/* Gradient Border */}
            <div className="p-[2px] rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-all duration-300 group">
              <button className="px-8 py-4 bg-gray-900 text-white rounded-[10px] font-bold group-hover:bg-gray-800 transition-colors">
                Gradient Border
              </button>
            </div>
          </div>
        </section>

        {/* Section 5: Shadow Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            5. Shadow Effects
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Colored Shadow */}
            <button className="px-8 py-4 bg-blue-500 text-white rounded-xl font-bold transition-shadow duration-300 shadow-lg hover:shadow-blue-500/50 hover:shadow-2xl">
              Blue Shadow
            </button>

            {/* Multi-layer Shadow */}
            <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]">
              Deep Shadow
            </button>

            {/* Neon Glow */}
            <button className="px-8 py-4 bg-black text-green-400 rounded-xl font-bold border border-green-400 transition-all duration-300 hover:shadow-[0_0_20px_#22c55e,0_0_40px_#22c55e,0_0_60px_#22c55e] hover:text-green-300">
              Neon Glow
            </button>

            {/* Inner Shadow on Hover */}
            <button className="px-8 py-4 bg-gray-700 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-[inset_0_-4px_10px_rgba(0,0,0,0.5)]">
              Inner Shadow
            </button>
          </div>
        </section>

        {/* Section 6: Background Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            6. Background Effects
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Gradient Shift */}
            <button className="px-8 py-4 text-white rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-[length:200%_200%] bg-left hover:bg-right transition-all duration-500">
              Gradient Shift
            </button>

            {/* Shimmer Effect */}
            <button className="relative px-8 py-4 bg-gray-700 text-white rounded-xl font-bold overflow-hidden group">
              <span className="relative z-10">Shimmer</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </button>

            {/* Fill from Left */}
            <button className="relative px-8 py-4 text-white rounded-xl font-bold overflow-hidden border-2 border-rose-500 group">
              <span className="relative z-10 group-hover:text-white transition-colors">Fill Left</span>
              <div className="absolute inset-0 bg-rose-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
            </button>

            {/* Fill from Bottom */}
            <button className="relative px-8 py-4 text-white rounded-xl font-bold overflow-hidden border-2 border-teal-500 group">
              <span className="relative z-10 group-hover:text-white transition-colors">Fill Up</span>
              <div className="absolute inset-0 bg-teal-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </section>

        {/* Section 7: Icon Animations */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            7. Icon Animation Buttons
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Arrow Move Right */}
            <button className="group px-8 py-4 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center gap-2">
              Next
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Download with Bounce */}
            <button className="group px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5 transition-transform group-hover:translate-y-1 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>

            {/* Heart Pulse */}
            <button className="group px-8 py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:animate-pulse group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Like
            </button>

            {/* Plus Rotate */}
            <button className="group px-8 py-4 bg-violet-500 text-white rounded-xl font-bold hover:bg-violet-600 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </section>

        {/* Section 8: Special Effects */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            8. Special Effects
          </h2>
          <div className="flex flex-wrap gap-6">
            {/* Glass Morphism */}
            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-all duration-300 hover:shadow-lg">
              Glass Button
            </button>

            {/* Ripple Effect (CSS only simulation) */}
            <button className="relative px-8 py-4 bg-blue-500 text-white rounded-xl font-bold overflow-hidden group active:scale-95 transition-transform">
              <span className="relative z-10">Ripple Click</span>
              <span className="absolute inset-0 bg-white/30 scale-0 group-active:scale-100 rounded-full transition-transform duration-500 origin-center"></span>
            </button>

            {/* Magnetic Hover (visual only) */}
            <button className="px-8 py-4 bg-gradient-to-br from-pink-500 to-orange-400 text-white rounded-xl font-bold transition-all duration-300 hover:rotate-1 hover:scale-105 hover:-translate-y-1 hover:shadow-2xl">
              3D Lift
            </button>

            {/* Cyberpunk Style */}
            <button className="relative px-8 py-4 bg-black text-cyan-400 font-bold border-2 border-cyan-400 transition-all duration-300 hover:bg-cyan-400 hover:text-black group clip-path-cyber">
              <span className="relative z-10">CYBERPUNK</span>
              <div className="absolute -bottom-1 -right-1 w-full h-full border-2 border-pink-500 transition-all duration-300 group-hover:-bottom-2 group-hover:-right-2"></div>
            </button>
          </div>
        </section>

        {/* Back Link */}
        <div className="text-center mt-12">
          <Link
            href="/en"
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
