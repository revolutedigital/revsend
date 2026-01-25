import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys'],
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
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig
