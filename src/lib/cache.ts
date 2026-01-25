import { redis } from './redis'

export interface CacheOptions {
  /**
   * TTL (Time To Live) em segundos
   * @default 300 (5 minutos)
   */
  ttl?: number

  /**
   * Se true, não usa cache e força busca fresh
   * @default false
   */
  bypassCache?: boolean

  /**
   * Tags para invalidação em grupo
   */
  tags?: string[]
}

/**
 * Cache wrapper genérico com Redis
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, bypassCache = false, tags = [] } = options

  // Se bypass está ativado, executa direto
  if (bypassCache) {
    return fn()
  }

  try {
    // Tenta buscar do cache
    const cached = await redis.get(key)

    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.error(`Cache read error for key ${key}:`, error)
    // Se falhar ao ler cache, continua e busca fresh
  }

  // Busca fresh data
  const data = await fn()

  // Salva no cache (fire and forget)
  saveToCacheAsync(key, data, ttl, tags).catch((error) => {
    console.error(`Cache write error for key ${key}:`, error)
  })

  return data
}

/**
 * Salva no cache de forma assíncrona
 */
async function saveToCacheAsync<T>(
  key: string,
  data: T,
  ttl: number,
  tags: string[]
): Promise<void> {
  try {
    const serialized = JSON.stringify(data)

    // Salva com TTL
    await redis.setex(key, ttl, serialized)

    // Se tem tags, adiciona à lista de keys da tag
    if (tags.length > 0) {
      const pipeline = redis.pipeline()

      for (const tag of tags) {
        const tagKey = `cache_tag:${tag}`
        pipeline.sadd(tagKey, key)
        pipeline.expire(tagKey, ttl)
      }

      await pipeline.exec()
    }
  } catch (error) {
    console.error('Error saving to cache:', error)
  }
}

/**
 * Invalida uma chave específica
 */
export async function invalidate(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Cache invalidation error for key ${key}:`, error)
  }
}

/**
 * Invalida todas as chaves com uma tag
 */
export async function invalidateByTag(tag: string): Promise<void> {
  try {
    const tagKey = `cache_tag:${tag}`

    // Busca todas as keys com essa tag
    const keys = await redis.smembers(tagKey)

    if (keys.length === 0) return

    // Deleta todas as keys e a tag
    const pipeline = redis.pipeline()

    for (const key of keys) {
      pipeline.del(key)
    }

    pipeline.del(tagKey)

    await pipeline.exec()
  } catch (error) {
    console.error(`Cache invalidation by tag error for tag ${tag}:`, error)
  }
}

/**
 * Invalida múltiplas chaves por padrão (ex: 'user:*')
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    // Busca keys que correspondem ao padrão
    const keys = await redis.keys(pattern)

    if (keys.length === 0) return

    // Deleta todas
    await redis.del(...keys)
  } catch (error) {
    console.error(`Cache pattern invalidation error for pattern ${pattern}:`, error)
  }
}

/**
 * Cache helpers pré-configurados
 */
export const CacheKeys = {
  // User
  user: (userId: string) => `user:${userId}`,
  userSettings: (userId: string) => `user_settings:${userId}`,

  // Campaigns
  campaigns: (userId: string) => `campaigns:${userId}`,
  campaign: (campaignId: string) => `campaign:${campaignId}`,
  campaignStats: (campaignId: string) => `campaign_stats:${campaignId}`,

  // Contacts
  contacts: (listId: string) => `contacts:${listId}`,
  contactLists: (userId: string) => `contact_lists:${userId}`,

  // WhatsApp
  whatsappNumbers: (userId: string) => `whatsapp_numbers:${userId}`,

  // Reports
  reports: (userId: string) => `reports:${userId}`,
  reportsOverview: (userId: string) => `reports_overview:${userId}`,

  // Templates
  templates: (userId: string) => `templates:${userId}`,

  // Webhooks
  webhooks: (userId: string) => `webhooks:${userId}`,

  // CRM
  deals: (userId: string) => `deals:${userId}`,
  pipelineStages: (userId: string) => `pipeline_stages:${userId}`,
} as const

/**
 * TTL padrões por tipo de dado
 */
export const CacheTTL = {
  // Muito curto (dados que mudam frequentemente)
  SHORT: 60, // 1 minuto

  // Curto (dados semi-dinâmicos)
  MEDIUM: 300, // 5 minutos

  // Longo (dados relativamente estáticos)
  LONG: 1800, // 30 minutos

  // Muito longo (dados raramente mudam)
  VERY_LONG: 3600, // 1 hora

  // Dados quase estáticos
  STATIC: 86400, // 24 horas
} as const
