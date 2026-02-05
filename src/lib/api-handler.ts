import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { logger, createRequestLogger } from './logger'
import { captureError, setUserContext } from './error-tracking'
import { hasPermission, getEffectiveRole, Action, Role } from './permissions'
import crypto from 'crypto'

export interface ApiSession {
  user: {
    id: string
    email?: string
    name?: string
    isMaster: boolean
    organizationId: string | null
    role: Role
  }
}

type ApiHandler = (
  req: NextRequest,
  context: {
    params?: Record<string, string>
    session?: ApiSession
  }
) => Promise<NextResponse>

interface ApiHandlerOptions {
  requireAuth?: boolean
  requiredPermission?: Action
  allowNoOrg?: boolean // Allow routes to work without an organization (for admin routes)
}

/**
 * Wraps an API route handler with logging, error tracking, auth, and permissions.
 */
export function apiHandler(handler: ApiHandler, options: ApiHandlerOptions = { requireAuth: true }) {
  return async (req: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }) => {
    const requestId = crypto.randomUUID()
    const start = Date.now()
    const url = req.nextUrl.pathname
    const method = req.method

    const reqLogger = createRequestLogger(requestId)

    reqLogger.info({ method, url }, 'Request started')

    try {
      let apiSession: ApiSession | undefined = undefined

      if (options.requireAuth !== false) {
        const session = await auth()
        if (!session?.user?.id) {
          reqLogger.warn({ method, url }, 'Unauthorized request')
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get effective role
        const role = getEffectiveRole(session.user.isMaster, session.user.currentOrgRole)

        // Check if organization is required and user has one
        if (!options.allowNoOrg && !session.user.isMaster && !session.user.currentOrgId) {
          reqLogger.warn({ method, url, userId: session.user.id }, 'User has no organization')
          return NextResponse.json(
            { error: 'Você precisa estar em uma organização para acessar este recurso' },
            { status: 403 }
          )
        }

        // Check permission if required
        if (options.requiredPermission && !hasPermission(role, options.requiredPermission)) {
          reqLogger.warn(
            { method, url, userId: session.user.id, role, requiredPermission: options.requiredPermission },
            'Permission denied'
          )
          return NextResponse.json(
            { error: 'Você não tem permissão para acessar este recurso' },
            { status: 403 }
          )
        }

        setUserContext({
          id: session.user.id,
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
        })

        apiSession = {
          user: {
            id: session.user.id,
            email: session.user.email ?? undefined,
            name: session.user.name ?? undefined,
            isMaster: session.user.isMaster,
            organizationId: session.user.currentOrgId,
            role,
          },
        }

        reqLogger.info(
          {
            userId: session.user.id,
            orgId: session.user.currentOrgId,
            role,
          },
          'Authenticated'
        )
      }

      // Await params if it's a promise (Next.js 15+)
      const params = routeContext?.params ? await routeContext.params : undefined

      const response = await handler(req, {
        params,
        session: apiSession,
      })

      const duration = Date.now() - start
      reqLogger.info({ method, url, status: response.status, duration }, 'Request completed')

      return response
    } catch (error) {
      const duration = Date.now() - start
      reqLogger.error({ method, url, duration, error }, 'Request failed')
      captureError(error, { tags: { route: url, method }, extra: { requestId } })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to get organization filter for queries
 * Returns the appropriate where clause for multi-tenant queries
 */
export function getOrgFilter(session: ApiSession | undefined): { organizationId: string } | null {
  if (!session?.user.organizationId) return null
  return { organizationId: session.user.organizationId }
}

/**
 * Helper to check if user can access all deals or only assigned ones
 */
export function getDealsFilter(session: ApiSession | undefined): Record<string, unknown> {
  if (!session?.user.organizationId) return {}

  const filter: Record<string, unknown> = {
    organizationId: session.user.organizationId,
  }

  // Vendedor can only see assigned deals
  if (session.user.role === 'vendedor') {
    filter.assignedToId = session.user.id
  }

  return filter
}

/**
 * Helper to check if user can access a specific resource
 */
export function canAccessResource(
  session: ApiSession | undefined,
  resourceOrgId: string | null
): boolean {
  if (!session) return false
  if (session.user.isMaster) return true
  if (!resourceOrgId) return false
  return session.user.organizationId === resourceOrgId
}
