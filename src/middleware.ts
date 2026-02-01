import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { rateLimit, RATE_LIMITS, getRateLimitIdentifier } from '@/lib/rate-limit'

/**
 * Security headers para todas as rotas
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy, mas não faz mal)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js precisa de unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind precisa de unsafe-inline
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.anthropic.com",
    "frame-ancestors 'none'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // HSTS (force HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

/**
 * Rate limiting configuration por rota
 */
function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith('/api/auth/register')) {
    return RATE_LIMITS.REGISTER
  }

  if (pathname.includes('/login') || pathname.includes('/signin')) {
    return RATE_LIMITS.LOGIN
  }

  if (pathname.startsWith('/api/ai/')) {
    return RATE_LIMITS.AI_VARIATIONS
  }

  if (pathname.includes('/upload')) {
    return RATE_LIMITS.FILE_UPLOAD
  }

  if (
    pathname.startsWith('/api/') &&
    (pathname.includes('POST') || pathname.includes('PUT') || pathname.includes('DELETE'))
  ) {
    return RATE_LIMITS.API_WRITE
  }

  if (pathname.startsWith('/api/')) {
    return RATE_LIMITS.API_DEFAULT
  }

  return null // Sem rate limit
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files e _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // arquivos com extensão
  ) {
    return NextResponse.next()
  }

  // Get session para identificar usuário
  const session = await auth()
  const userId = session?.user?.id

  // Locale negotiation
  const locale = negotiateLocale(request)

  // Rate limiting
  const rateLimitConfig = getRateLimitConfig(pathname)

  if (rateLimitConfig) {
    const identifier = getRateLimitIdentifier(request, userId)
    const rateLimitResult = await rateLimit(identifier, rateLimitConfig)

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Você excedeu o limite de requisições. Tente novamente mais tarde.',
        },
        { status: 429 }
      )

      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())
      response.headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString())

      return addSecurityHeaders(response)
    }

    // Adiciona headers de rate limit na resposta bem-sucedida
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    return addSecurityHeaders(response)
  }

  // Para rotas sem rate limit, apenas adiciona security headers
  const response = NextResponse.next()

  // Set locale cookie if not present
  if (!request.cookies.get('locale')) {
    response.cookies.set('locale', locale, { path: '/', maxAge: 365 * 24 * 60 * 60 })
  }

  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/health (health check)
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api/health|_next|static|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
