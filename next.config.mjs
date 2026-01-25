import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys'],
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
