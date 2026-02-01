import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys'],
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Power bundle analyzer em desenvolvimento
  webpack: (config, { dev, isServer }) => {
    // Tree shaking
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
      }
    }

    return config
  },

  // Sentry source maps upload
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
  },
}

const sentryWebpackPluginOptions = {
  // Upload source maps apenas em production
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token para upload de source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,
}

// Export com Sentry wrapper se DSN estiver configurado
const finalConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig

export default withBundleAnalyzer(finalConfig)
