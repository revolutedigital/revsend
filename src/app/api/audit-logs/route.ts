import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import {
  getOrganizationAuditLogs,
  getOrganizationAuditLogStats,
  getAllAuditLogs,
  getAuditLogStats,
} from '@/lib/audit/audit-logger'

/**
 * GET /api/audit-logs
 * Get audit logs for current organization
 * Master users can see all logs across all organizations
 */
export const GET = apiHandler(
  async (request: NextRequest, { session }) => {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action') || undefined

    // Master users can see all logs across all organizations
    if (session!.user.isMaster) {
      const [logs, stats] = await Promise.all([
        getAllAuditLogs({ limit, offset, action }),
        getAuditLogStats(),
      ])

      return NextResponse.json({
        logs,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.total,
        },
      })
    }

    // Regular users see only their organization's logs
    const organizationId = session!.user.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Você precisa estar em uma organização para ver os logs' },
        { status: 403 }
      )
    }

    const [logs, stats] = await Promise.all([
      getOrganizationAuditLogs(organizationId, { limit, offset, action }),
      getOrganizationAuditLogStats(organizationId),
    ])

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    })
  },
  { requiredPermission: 'audit:read' }
)
