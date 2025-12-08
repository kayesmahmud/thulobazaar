import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@thulobazaar/types', '@thulobazaar/utils', '@thulobazaar/api-client'],
  // Empty turbopack config to silence Next.js 16 warning about webpack config
  // This allows us to keep using webpack config while acknowledging Turbopack is available
  turbopack: {},
  // Webpack config to handle Node.js modules in pg adapter (Prisma 7)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          net: false,
          dns: false,
          tls: false,
          fs: false,
          'pg-native': false,
        },
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
    ];
  },
}

export default nextConfig
