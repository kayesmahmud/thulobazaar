'use client';

import Link from 'next/link';

export default function TestingBgPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          Tailwind CSS Background Styles
        </h1>
        <p className="text-gray-400 text-center mb-12">
          Solid colors, gradients, patterns, and animations - all with Tailwind CSS
        </p>

        {/* Section 1: Solid Colors */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            1. Solid Colors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="h-24 rounded-xl bg-red-500 flex items-center justify-center text-white font-bold text-sm">red-500</div>
            <div className="h-24 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-sm">orange-500</div>
            <div className="h-24 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-sm">amber-500</div>
            <div className="h-24 rounded-xl bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">yellow-500</div>
            <div className="h-24 rounded-xl bg-lime-500 flex items-center justify-center text-white font-bold text-sm">lime-500</div>
            <div className="h-24 rounded-xl bg-green-500 flex items-center justify-center text-white font-bold text-sm">green-500</div>
            <div className="h-24 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">emerald-500</div>
            <div className="h-24 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold text-sm">teal-500</div>
            <div className="h-24 rounded-xl bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">cyan-500</div>
            <div className="h-24 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm">sky-500</div>
            <div className="h-24 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm">blue-500</div>
            <div className="h-24 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">indigo-500</div>
            <div className="h-24 rounded-xl bg-violet-500 flex items-center justify-center text-white font-bold text-sm">violet-500</div>
            <div className="h-24 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-sm">purple-500</div>
            <div className="h-24 rounded-xl bg-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">fuchsia-500</div>
            <div className="h-24 rounded-xl bg-pink-500 flex items-center justify-center text-white font-bold text-sm">pink-500</div>
            <div className="h-24 rounded-xl bg-rose-500 flex items-center justify-center text-white font-bold text-sm">rose-500</div>
            <div className="h-24 rounded-xl bg-slate-500 flex items-center justify-center text-white font-bold text-sm">slate-500</div>
          </div>
        </section>

        {/* Section 2: Linear Gradients */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            2. Linear Gradients (bg-gradient-to-*)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Direction variations */}
            <div className="h-32 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
              to-r (Right)<br/>from-blue-500 to-purple-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-l from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
              to-l (Left)<br/>from-blue-500 to-purple-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-t from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
              to-t (Top)<br/>from-blue-500 to-purple-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-b from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
              to-b (Bottom)<br/>from-blue-500 to-purple-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
              to-br (Bottom Right)<br/>from-blue-500 to-purple-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-tl from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center">
              to-tl (Top Left)<br/>from-blue-500 to-purple-500
            </div>
          </div>
        </section>

        {/* Section 3: Multi-color Gradients */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            3. Multi-color Gradients (via-*)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 rounded-xl bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center shadow-lg">
              Rainbow: from-red-500 via-yellow-500 to-green-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center shadow-lg">
              Sunset: from-purple-500 via-pink-500 to-rose-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center shadow-lg">
              Nature: from-green-400 via-emerald-500 to-teal-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm p-4 text-center shadow-lg">
              Ocean: from-blue-500 via-cyan-500 to-teal-400
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center shadow-lg">
              Galaxy: from-indigo-600 via-purple-600 to-pink-500
            </div>
            <div className="h-32 rounded-xl bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm p-4 text-center shadow-lg">
              Fire: from-orange-400 via-amber-500 to-yellow-500
            </div>
          </div>
        </section>

        {/* Section 4: Radial-like Effects */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            4. Radial-like & Special Effects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Spotlight effect */}
            <div className="h-40 rounded-xl bg-gray-900 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/30 via-transparent to-transparent"></div>
              <span className="relative text-white font-bold text-sm">Spotlight Top</span>
            </div>

            {/* Center glow */}
            <div className="h-40 rounded-xl bg-gray-900 relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
              <span className="relative text-white font-bold text-sm">Center Glow</span>
            </div>

            {/* Multiple glows */}
            <div className="h-40 rounded-xl bg-gray-900 relative overflow-hidden flex items-center justify-center">
              <div className="absolute top-0 left-0 w-24 h-24 bg-pink-500 rounded-full blur-3xl opacity-40"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-cyan-500 rounded-full blur-3xl opacity-40"></div>
              <span className="relative text-white font-bold text-sm">Multi Glow</span>
            </div>

            {/* Glass morphism */}
            <div className="h-40 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Glass Morphism</span>
            </div>

            {/* Frosted glass */}
            <div className="h-40 rounded-xl bg-white/10 backdrop-blur-lg border border-white/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Frosted Glass</span>
            </div>

            {/* Mesh gradient simulation */}
            <div className="h-40 rounded-xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 to-transparent"></div>
              <span className="relative text-white font-bold text-sm">Mesh Gradient</span>
            </div>
          </div>
        </section>

        {/* Section 5: Animated Backgrounds */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            5. Animated Backgrounds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Pulse glow */}
            <div className="h-40 rounded-xl bg-gray-800 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-purple-500/20 animate-pulse"></div>
              <span className="relative text-white font-bold text-sm">Pulse Overlay</span>
            </div>

            {/* Breathing glow */}
            <div className="h-40 rounded-xl bg-gray-900 relative overflow-hidden flex items-center justify-center group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-cyan-500 rounded-full blur-3xl animate-pulse"></div>
              <span className="relative text-white font-bold text-sm">Breathing Glow</span>
            </div>

            {/* Shimmer effect */}
            <div className="h-40 rounded-xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 relative overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <span className="relative text-white font-bold text-sm">Shimmer (Hover)</span>
            </div>

            {/* Gradient shift - using CSS animation */}
            <div className="h-40 rounded-xl relative overflow-hidden flex items-center justify-center animate-gradient-shift">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x"></div>
              <span className="relative text-white font-bold text-sm">Gradient Shift</span>
            </div>

            {/* Floating orbs */}
            <div className="h-40 rounded-xl bg-gray-900 relative overflow-hidden flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-blue-500 rounded-full blur-2xl opacity-60 animate-bounce [animation-delay:0s]" style={{top: '20%', left: '20%'}}></div>
              <div className="absolute w-12 h-12 bg-purple-500 rounded-full blur-2xl opacity-60 animate-bounce [animation-delay:0.5s]" style={{top: '50%', right: '20%'}}></div>
              <div className="absolute w-10 h-10 bg-pink-500 rounded-full blur-2xl opacity-60 animate-bounce [animation-delay:1s]" style={{bottom: '20%', left: '40%'}}></div>
              <span className="relative text-white font-bold text-sm">Floating Orbs</span>
            </div>

            {/* Spin ring */}
            <div className="h-40 rounded-xl bg-gray-900 relative overflow-hidden flex items-center justify-center">
              <div className="absolute w-32 h-32 border-4 border-transparent border-t-cyan-500 border-r-purple-500 rounded-full animate-spin"></div>
              <span className="relative text-white font-bold text-sm">Spin Ring</span>
            </div>
          </div>
        </section>

        {/* Section 6: Pattern Backgrounds */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            6. Pattern Backgrounds (CSS + Tailwind)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dots pattern */}
            <div className="h-40 rounded-xl flex items-center justify-center" style={{
              backgroundColor: '#1f2937',
              backgroundImage: 'radial-gradient(circle, #4b5563 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}>
              <span className="text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded">Dots Pattern</span>
            </div>

            {/* Grid pattern */}
            <div className="h-40 rounded-xl flex items-center justify-center" style={{
              backgroundColor: '#1f2937',
              backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}>
              <span className="text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded">Grid Pattern</span>
            </div>

            {/* Diagonal stripes */}
            <div className="h-40 rounded-xl flex items-center justify-center" style={{
              backgroundColor: '#1f2937',
              backgroundImage: 'repeating-linear-gradient(45deg, #374151 0, #374151 1px, transparent 0, transparent 50%)',
              backgroundSize: '10px 10px'
            }}>
              <span className="text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded">Diagonal Stripes</span>
            </div>

            {/* Checkerboard */}
            <div className="h-40 rounded-xl flex items-center justify-center" style={{
              backgroundColor: '#1f2937',
              backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}>
              <span className="text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded">Checkerboard</span>
            </div>

            {/* Zigzag */}
            <div className="h-40 rounded-xl flex items-center justify-center" style={{
              backgroundColor: '#1f2937',
              backgroundImage: 'linear-gradient(135deg, #374151 25%, transparent 25%), linear-gradient(225deg, #374151 25%, transparent 25%), linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(315deg, #374151 25%, #1f2937 25%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '10px 0, 10px 0, 0 0, 0 0'
            }}>
              <span className="text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded">Zigzag</span>
            </div>

            {/* Hexagons (approximation) */}
            <div className="h-40 rounded-xl flex items-center justify-center relative overflow-hidden bg-gray-800">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle farthest-side at 0% 50%, #4b5563 23.5%, transparent 0) 21px 30px, radial-gradient(circle farthest-side at 0% 50%, #374151 24%, transparent 0) 19px 30px, linear-gradient(#4b5563 14%, transparent 0, transparent 85%, #4b5563 0) 0 0, linear-gradient(150deg, #4b5563 24%, #374151 0, #374151 26%, transparent 0, transparent 74%, #374151 0, #374151 76%, #4b5563 0) 0 0, linear-gradient(30deg, #4b5563 24%, #374151 0, #374151 26%, transparent 0, transparent 74%, #374151 0, #374151 76%, #4b5563 0) 0 0, linear-gradient(90deg, #374151 2%, #4b5563 0, #4b5563 98%, #374151 0%) 0 0',
                backgroundSize: '40px 60px'
              }}></div>
              <span className="relative text-white font-bold text-sm bg-gray-900/80 px-3 py-1 rounded">Honeycomb</span>
            </div>
          </div>
        </section>

        {/* Section 7: Hero Section Backgrounds */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            7. Hero Section Backgrounds
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {/* Aurora */}
            <div className="h-64 rounded-xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gray-900"></div>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-[100px] opacity-30 animate-pulse [animation-delay:1s]"></div>
              <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full blur-[100px] opacity-20 animate-pulse [animation-delay:2s]"></div>
              <div className="relative text-center">
                <h3 className="text-3xl font-bold text-white mb-2">Aurora Effect</h3>
                <p className="text-gray-300">Blurred circles with pulse animation</p>
              </div>
            </div>

            {/* Gradient with shapes */}
            <div className="h-64 rounded-xl relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
              </div>
              <div className="relative text-center">
                <h3 className="text-3xl font-bold text-white mb-2">Gradient + Shapes</h3>
                <p className="text-white/80">Like our homepage hero!</p>
              </div>
            </div>

            {/* Dark with grid */}
            <div className="h-64 rounded-xl relative overflow-hidden flex items-center justify-center bg-black">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
              <div className="relative text-center">
                <h3 className="text-3xl font-bold text-white mb-2">Grid + Gradient</h3>
                <p className="text-gray-400">Modern tech aesthetic</p>
              </div>
            </div>

            {/* Starfield */}
            <div className="h-64 rounded-xl relative overflow-hidden flex items-center justify-center bg-gray-950">
              {/* Stars (dots) */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(2px 2px at 20px 30px, white, transparent), radial-gradient(2px 2px at 40px 70px, white, transparent), radial-gradient(1px 1px at 90px 40px, white, transparent), radial-gradient(2px 2px at 160px 120px, white, transparent), radial-gradient(1px 1px at 230px 80px, white, transparent), radial-gradient(2px 2px at 300px 150px, white, transparent), radial-gradient(1px 1px at 350px 50px, white, transparent), radial-gradient(2px 2px at 420px 180px, white, transparent), radial-gradient(1px 1px at 500px 90px, white, transparent), radial-gradient(2px 2px at 580px 130px, white, transparent)',
                backgroundSize: '600px 200px',
                opacity: 0.5
              }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
              <div className="relative text-center">
                <h3 className="text-3xl font-bold text-white mb-2">Starfield</h3>
                <p className="text-gray-400">Space theme with radial gradients</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Opacity & Overlays */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
            8. Opacity & Color Overlays
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 rounded-xl bg-blue-500/10 flex items-center justify-center text-white font-bold text-sm">blue-500/10</div>
            <div className="h-24 rounded-xl bg-blue-500/25 flex items-center justify-center text-white font-bold text-sm">blue-500/25</div>
            <div className="h-24 rounded-xl bg-blue-500/50 flex items-center justify-center text-white font-bold text-sm">blue-500/50</div>
            <div className="h-24 rounded-xl bg-blue-500/75 flex items-center justify-center text-white font-bold text-sm">blue-500/75</div>
            <div className="h-24 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold text-sm">white/5</div>
            <div className="h-24 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">white/10</div>
            <div className="h-24 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm">white/20</div>
            <div className="h-24 rounded-xl bg-white/30 flex items-center justify-center text-white font-bold text-sm">white/30</div>
          </div>
        </section>

        {/* Custom CSS for gradient animation */}
        <style jsx global>{`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            animation: gradient-x 3s ease infinite;
          }
        `}</style>

        {/* Back Link */}
        <div className="text-center mt-12 space-x-4">
          <Link
            href="/en/testing"
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            ← Button Animations
          </Link>
          <Link
            href="/en"
            className="text-gray-400 hover:text-white transition-colors underline"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
