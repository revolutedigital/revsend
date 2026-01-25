import { db } from './db'
import { Prisma } from '@prisma/client'

/**
 * Full-text search em contatos usando PostgreSQL tsvector
 *
 * Busca por nome, telefone, email e empresa
 */
export async function searchContacts(
  userId: string,
  query: string,
  options: {
    listId?: string
    limit?: number
    offset?: number
  } = {}
) {
  const { listId, limit = 50, offset = 0 } = options

  // Sanitiza a query para PostgreSQL tsquery
  const sanitizedQuery = query
    .trim()
    .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' & ')

  if (!sanitizedQuery) {
    return []
  }

  // Query SQL raw para usar full-text search
  const whereConditions: string[] = [
    `c."user_id" = $1`,
    `c.search_vector @@ to_tsquery('portuguese', $2)`,
  ]

  const params: (string | number)[] = [userId, sanitizedQuery]

  if (listId) {
    whereConditions.push(`c."list_id" = $3`)
    params.push(listId)
  }

  const offsetParam = listId ? '$4' : '$3'
  const limitParam = listId ? '$5' : '$4'
  params.push(offset, limit)

  const sql = `
    SELECT
      c.id,
      c.name,
      c.phone_number as "phoneNumber",
      c.email,
      c.extra_fields as "extraFields",
      c.list_id as "listId",
      c.created_at as "createdAt",
      ts_rank(c.search_vector, to_tsquery('portuguese', $2)) as rank
    FROM contacts c
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY rank DESC, c.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `

  const results = await db.$queryRawUnsafe(sql, ...params)

  return results as Array<{
    id: string
    name: string
    phoneNumber: string
    email: string | null
    extraFields: Prisma.JsonValue
    listId: string
    createdAt: Date
    rank: number
  }>
}

/**
 * Busca simples (fallback se full-text search não estiver configurado)
 */
export async function simpleSearchContacts(
  userId: string,
  query: string,
  options: {
    listId?: string
    limit?: number
  } = {}
) {
  const { listId, limit = 50 } = options

  const where: Prisma.ContactWhereInput = {
    userId,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { phoneNumber: { contains: query } },
      { email: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (listId) {
    where.listId = listId
  }

  return db.contact.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Auto-detecta se full-text search está disponível e usa o método apropriado
 */
export async function smartSearchContacts(
  userId: string,
  query: string,
  options: {
    listId?: string
    limit?: number
    offset?: number
  } = {}
) {
  try {
    // Tenta usar full-text search
    return await searchContacts(userId, query, options)
  } catch (error) {
    console.warn('Full-text search not available, falling back to simple search:', error)

    // Fallback para busca simples
    return await simpleSearchContacts(userId, query, {
      listId: options.listId,
      limit: options.limit,
    })
  }
}
