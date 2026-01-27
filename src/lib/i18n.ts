import { cookies } from 'next/headers'

export const locales = ['pt-BR', 'en-US', 'es', 'fr', 'de'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'pt-BR'

// Language display names and flags
export const localeConfig: Record<Locale, { name: string; flag: string; nativeName: string }> = {
  'pt-BR': { name: 'Portuguese (Brazil)', flag: '🇧🇷', nativeName: 'Português (Brasil)' },
  'en-US': { name: 'English (US)', flag: '🇺🇸', nativeName: 'English (US)' },
  'es': { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  'fr': { name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  'de': { name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
}

const LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * Get current locale from cookies or default
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined

  if (locale && locales.includes(locale)) {
    return locale
  }

  return defaultLocale
}

/**
 * Get messages for current locale
 */
export async function getMessages(locale?: Locale): Promise<Record<string, any>> {
  const currentLocale = locale || (await getLocale())

  try {
    const messages = await import(`../../messages/${currentLocale}.json`)
    return messages.default
  } catch {
    // Fallback to default locale
    const messages = await import(`../../messages/${defaultLocale}.json`)
    return messages.default
  }
}

/**
 * Set locale cookie
 */
export async function setLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax',
  })
}

/**
 * Get translation function
 */
export function createTranslator(messages: Record<string, any>) {
  return function t(key: string, values?: Record<string, string | number>): string {
    // Navigate through nested keys (e.g., "auth.loginTitle")
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found`)
      return key
    }

    // Replace variables {variable} with values
    if (values) {
      return value.replace(/\{(\w+)\}/g, (_, varName) => {
        return values[varName]?.toString() || `{${varName}}`
      })
    }

    return value
  }
}
