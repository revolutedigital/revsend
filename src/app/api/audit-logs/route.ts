import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserAuditLogs, getAuditLogStats } from '@/lib/audit/audit-logger'

/**
 * GET /api/audit-logs
 * Get audit logs for current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action') || undefined

    const [logs, stats] = await Promise.all([
      getUserAuditLogs(session.user.id, { limit, offset, action }),
      getAuditLogStats(session.user.id),
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
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
