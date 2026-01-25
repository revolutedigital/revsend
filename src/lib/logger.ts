import pino from 'pino'

/**
 * Structured logger usando Pino
 *
 * Uso:
 * import { logger } from '@/lib/logger'
 *
 * logger.info('User logged in', { userId: '123' })
 * logger.error(error, 'Failed to process payment')
 */

const isDevelopment = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print em desenvolvimento
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Formato JSON em produção
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
  },

  // Adiciona timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serializers para objetos comuns
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Redact sensitive data
  redact: {
    paths: [
      'password',
      'req.headers.authorization',
      'req.headers.cookie',
      'apiKey',
      'anthropicApiKey',
      'secret',
      'token',
      '*.password',
      '*.apiKey',
      '*.secret',
      '*.token',
    ],
    remove: true,
  },
})

/**
 * Child logger com contexto
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Logger específico para requests HTTP
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
    context: 'http',
  })
}

/**
 * Logger para jobs/workers
 */
export function createJobLogger(jobId: string, jobType: string) {
  return logger.child({
    jobId,
    jobType,
    context: 'job',
  })
}

/**
 * Helper para logar duração de operações
 */
export async function logOperation<T>(
  operationName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = Date.now()

  try {
    logger.debug({ operation: operationName, ...metadata }, 'Operation started')
    const result = await fn()
    const duration = Date.now() - start

    logger.info(
      { operation: operationName, duration, ...metadata },
      `Operation completed in ${duration}ms`
    )

    return result
  } catch (error) {
    const duration = Date.now() - start

    logger.error(
      { operation: operationName, duration, error, ...metadata },
      'Operation failed'
    )

    throw error
  }
}

/**
 * Exemplos de uso:
 *
 * // Log simples
 * logger.info('Server started on port 3000')
 *
 * // Log com contexto
 * logger.info({ userId: '123', action: 'login' }, 'User logged in')
 *
 * // Log de erro
 * logger.error(error, 'Failed to connect to database')
 *
 * // Child logger
 * const reqLogger = createRequestLogger('req-123', 'user-456')
 * reqLogger.info('Processing request')
 *
 * // Log de operação com timing
 * await logOperation('fetchCampaigns', async () => {
 *   return await db.campaign.findMany()
 * }, { userId: '123' })
 */
