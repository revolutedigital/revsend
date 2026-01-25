import { redis } from './redis'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requests na janela
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limiter baseado em Redis usando sliding window
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    // Remove entradas antigas (fora da janela)
    await redis.zremrangebyscore(key, 0, windowStart)

    // Conta requests na janela atual
    const requestCount = await redis.zcard(key)

    if (requestCount >= config.maxRequests) {
      // Busca o timestamp do request mais antigo para calcular reset
      const oldestRequests = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const resetTime = oldestRequests[1]
        ? parseInt(oldestRequests[1] as string) + config.windowMs
        : now + config.windowMs

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: resetTime,
      }
    }

    // Adiciona novo request
    await redis.zadd(key, now, `${now}-${Math.random()}`)

    // Define TTL na chave
    await redis.expire(key, Math.ceil(config.windowMs / 1000))

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - requestCount - 1,
      reset: now + config.windowMs,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Em caso de erro no Redis, permite o request (fail-open)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.windowMs,
    }
  }
}

// Configurações pré-definidas
export const RATE_LIMITS = {
  // Auth endpoints - muito restritivo
  LOGIN: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 5,
  },
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3,
  },

  // API endpoints - moderado
  API_DEFAULT: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100,
  },
  API_WRITE: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,
  },

  // AI endpoints - restritivo (custo)
  AI_VARIATIONS: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10,
  },

  // Upload endpoints - muito restritivo
  FILE_UPLOAD: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 5,
  },
} as const

/**
 * Helper para extrair identificador do request
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Se tem userId, usa userId (mais preciso)
  if (userId) {
    return `user:${userId}`
  }

  // Fallback para IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

  return `ip:${ip}`
}
