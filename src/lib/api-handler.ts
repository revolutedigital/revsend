import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { logger, createRequestLogger } from './logger'
import { captureError, setUserContext } from './error-tracking'
import crypto from 'crypto'

type ApiHandler = (
  req: NextRequest,
  context: { params?: Record<string, string>; session?: { user: { id: string; email?: string; name?: string } } }
) => Promise<NextResponse>

interface ApiHandlerOptions {
  requireAuth?: boolean
}

/**
 * Wraps an API route handler with logging, error tracking, and optional auth.
 */
export function apiHandler(handler: ApiHandler, options: ApiHandlerOptions = { requireAuth: true }) {
  return async (req: NextRequest, routeContext?: { params?: Record<string, string> }) => {
    const requestId = crypto.randomUUID()
    const start = Date.now()
    const url = req.nextUrl.pathname
    const method = req.method

    const reqLogger = createRequestLogger(requestId)

    reqLogger.info({ method, url }, 'Request started')

    try {
      let session = null
      if (options.requireAuth !== false) {
        session = await auth()
        if (!session?.user?.id) {
          reqLogger.warn({ method, url }, 'Unauthorized request')
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        setUserContext({ id: session.user.id, email: session.user.email ?? undefined, name: session.user.name ?? undefined })
        reqLogger.info({ userId: session.user.id }, 'Authenticated')
      }

      const response = await handler(req, {
        params: routeContext?.params,
        session: session?.user?.id ? { user: { id: session.user.id, email: session.user.email ?? undefined, name: session.user.name ?? undefined } } : undefined,
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
