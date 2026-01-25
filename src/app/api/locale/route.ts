import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { locales, type Locale } from '@/lib/i18n'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale } = body

    // Validate locale
    if (!locale || !locales.includes(locale as Locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('NEXT_LOCALE', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true, locale })
  } catch (error) {
    console.error('Error setting locale:', error)
    return NextResponse.json({ error: 'Failed to set locale' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'pt-BR'

    return NextResponse.json({ locale })
  } catch (error) {
    console.error('Error getting locale:', error)
    return NextResponse.json({ error: 'Failed to get locale' }, { status: 500 })
  }
}
