import * as Sentry from '@sentry/nextjs'

/**
 * Captura e loga um erro para o Sentry
 */
export function captureError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: {
      id?: string
      email?: string
      name?: string
    }
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  }
): void {
  // Log no console para desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Tracking]', error, context)
    return
  }

  // Set user context se fornecido
  if (context?.user) {
    Sentry.setUser(context.user)
  }

  // Set tags se fornecidos
  if (context?.tags) {
    Sentry.setTags(context.tags)
  }

  // Captura o erro
  Sentry.captureException(error, {
    level: context?.level || 'error',
    extra: context?.extra,
  })
}

/**
 * Captura uma mensagem (não-erro) para o Sentry
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
  }
): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${level.toUpperCase()}]`, message, context)
    return
  }

  if (context?.tags) {
    Sentry.setTags(context?.tags)
  }

  Sentry.captureMessage(message, {
    level,
    extra: context?.extra,
  })
}

/**
 * Wrapper para funções assíncronas com error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: {
    name?: string
    tags?: Record<string, string>
  }
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error, {
        tags: {
          function: context?.name || fn.name || 'unknown',
          ...context?.tags,
        },
        extra: {
          arguments: args,
        },
      })
      throw error
    }
  }) as T
}

/**
 * Set user context para rastreamento
 */
export function setUserContext(user: {
  id: string
  email?: string
  name?: string
}): void {
  if (process.env.NODE_ENV !== 'production') return

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  })
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (process.env.NODE_ENV !== 'production') return

  Sentry.setUser(null)
}

/**
 * Add breadcrumb (rastro de navegação)
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== 'production') return

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}
