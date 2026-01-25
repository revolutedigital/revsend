import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajusta a taxa de amostragem de transações (performance monitoring)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Ajusta a taxa de amostragem de sessões de replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Define o ambiente
  environment: process.env.NODE_ENV || 'development',

  // Ignora erros comuns que não são acionáveis
  ignoreErrors: [
    // Erros de rede que são esperados
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'Load failed',

    // Erros do browser que não podemos controlar
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',

    // Cancelamentos de navegação
    'AbortError',
    'cancelled',
  ],

  beforeSend(event, hint) {
    // Não envia eventos em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Sentry Debug]', hint.originalException || hint.syntheticException)
      return null
    }

    // Remove dados sensíveis
    if (event.request) {
      delete event.request.cookies

      // Remove headers de autenticação
      if (event.request.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.Cookie
      }
    }

    // Remove API keys de query strings
    if (event.request?.query_string) {
      const params = new URLSearchParams(event.request.query_string)
      if (params.has('api_key') || params.has('apiKey')) {
        params.delete('api_key')
        params.delete('apiKey')
        event.request.query_string = params.toString()
      }
    }

    return event
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})
