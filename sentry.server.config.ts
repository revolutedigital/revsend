import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Ajusta a taxa de amostragem de transações
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Define o ambiente
  environment: process.env.NODE_ENV || 'development',

  // Ignora erros comuns
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'AbortError',
  ],

  beforeSend(event, hint) {
    // Não envia eventos em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Sentry Server Debug]', hint.originalException || hint.syntheticException)
      return null
    }

    // Remove dados sensíveis das variáveis de ambiente
    if (event.contexts?.runtime?.env) {
      const env = event.contexts.runtime.env as Record<string, unknown>
      delete env.DATABASE_URL
      delete env.ANTHROPIC_API_KEY
      delete env.NEXTAUTH_SECRET
      delete env.ENCRYPTION_KEY
      delete env.REDIS_URL
    }

    // Remove dados sensíveis de request
    if (event.request) {
      delete event.request.cookies

      if (event.request.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.Cookie
      }

      // Remove senhas e API keys do body
      if (event.request.data) {
        const data = event.request.data as Record<string, unknown>
        if (data.password) data.password = '[REDACTED]'
        if (data.anthropicApiKey) data.anthropicApiKey = '[REDACTED]'
        if (data.apiKey) data.apiKey = '[REDACTED]'
      }
    }

    return event
  },

  // Captura erros não tratados
  integrations: [
    Sentry.extraErrorDataIntegration({ depth: 5 }),
    Sentry.httpIntegration({ failedRequestStatusCodes: [500, 599] }),
  ],
})
