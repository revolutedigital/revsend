import { db as prisma } from '@/lib/db'
import { headers } from 'next/headers'

export type AuditAction =
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'user.password_reset_request'
  | 'user.password_reset_complete'
  | 'user.2fa_enable'
  | 'user.2fa_disable'
  | 'user.2fa_verify'
  // Campaigns
  | 'campaign.create'
  | 'campaign.update'
  | 'campaign.delete'
  | 'campaign.start'
  | 'campaign.pause'
  | 'campaign.cancel'
  | 'campaign.complete'
  // Lists
  | 'list.create'
  | 'list.update'
  | 'list.delete'
  | 'list.upload'
  // Contacts
  | 'contact.create'
  | 'contact.update'
  | 'contact.delete'
  | 'contact.import'
  // WhatsApp
  | 'whatsapp.connect'
  | 'whatsapp.disconnect'
  | 'whatsapp.delete'
  // Settings
  | 'settings.update'
  | 'settings.api_key_update'
  // Webhooks
  | 'webhook.create'
  | 'webhook.update'
  | 'webhook.delete'
  // Media
  | 'media.upload'
  | 'media.delete'
  // Templates
  | 'template.create'
  | 'template.update'
  | 'template.delete'

export interface AuditLogOptions {
  userId?: string | null
  action: AuditAction
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(options: AuditLogOptions) {
  const { userId, action, resource, resourceId, details, ipAddress, userAgent } = options

  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource: resource || null,
        resourceId: resourceId || null,
        details: details ?? undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    })
  } catch (error) {
    // Don't throw errors for audit logs - just log them
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Create audit log from Next.js request
 */
export async function createAuditLogFromRequest(
  userId: string | null,
  action: AuditAction,
  resource?: string,
  resourceId?: string,
  details?: Record<string, any>
) {
  try {
    const headersList = await headers()
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      null
    const userAgent = headersList.get('user-agent') || null

    await createAuditLog({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    })
  } catch (error) {
    console.error('Failed to create audit log from request:', error)
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    action?: string
  }
) {
  const { limit = 50, offset = 0, action } = options || {}

  return await prisma.auditLog.findMany({
    where: {
      userId,
      ...(action && { action }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}

/**
 * Get audit logs for an organization
 */
export async function getOrganizationAuditLogs(
  organizationId: string,
  options?: {
    limit?: number
    offset?: number
    action?: string
  }
) {
  const { limit = 50, offset = 0, action } = options || {}

  return await prisma.auditLog.findMany({
    where: {
      organizationId,
      ...(action && { action }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Get audit log statistics for an organization
 */
export async function getOrganizationAuditLogStats(organizationId: string) {
  const where = { organizationId }

  const [total, last24h, lastWeek] = await Promise.all([
    // Total logs
    prisma.auditLog.count({ where }),

    // Last 24 hours
    prisma.auditLog.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Last week
    prisma.auditLog.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return {
    total,
    last24h,
    lastWeek,
  }
}

/**
 * Get all audit logs (admin only in future)
 */
export async function getAllAuditLogs(options?: {
  limit?: number
  offset?: number
  action?: string
  userId?: string
}) {
  const { limit = 100, offset = 0, action, userId } = options || {}

  return await prisma.auditLog.findMany({
    where: {
      ...(action && { action }),
      ...(userId && { userId }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })
}

/**
 * Delete old audit logs (cleanup)
 */
export async function deleteOldAuditLogs(daysToKeep: number = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  })

  return result.count
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(userId?: string) {
  const where = userId ? { userId } : {}

  const [total, last24h, lastWeek] = await Promise.all([
    // Total logs
    prisma.auditLog.count({ where }),

    // Last 24 hours
    prisma.auditLog.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Last week
    prisma.auditLog.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return {
    total,
    last24h,
    lastWeek,
  }
}
