import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NOTE: Rate limiting (via Redis) and auth (via Prisma) are handled in
// API route handlers, NOT in middleware, because middleware runs in the
// Edge Runtime which doesn't support Node.js modules like ioredis/bcryptjs.

/**
 * Security headers para todas as rotas
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.anthropic.com",
    "frame-ancestors 'none'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

const SUPPORTED_LOCALES = ['pt-BR', 'en-US', 'es', 'fr', 'de']
const DEFAULT_LOCALE = 'pt-BR'

function negotiateLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get('locale')?.value
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale
  }
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    const preferred = acceptLang
      .split(',')
      .map((lang) => lang.split(';')[0].trim())
      .find((lang) => SUPPORTED_LOCALES.some((sl) => lang.startsWith(sl.split('-')[0])))
    if (preferred) {
      const match = SUPPORTED_LOCALES.find((sl) => preferred.startsWith(sl.split('-')[0]))
      if (match) return match
    }
  }
  return DEFAULT_LOCALE
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Locale negotiation
  const locale = negotiateLocale(request)
  if (!request.cookies.get('locale')) {
    response.cookies.set('locale', locale, { path: '/', maxAge: 365 * 24 * 60 * 60 })
  }

  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!api/health|_next|static|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
