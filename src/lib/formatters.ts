/**
 * Internationalization Formatters
 * Uses Intl API for locale-aware formatting
 */

export type SupportedLocale = 'pt-BR' | 'en-US' | 'es' | 'fr' | 'de'

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale = 'pt-BR',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Format date with time according to locale
 */
export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLocale = 'pt-BR',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = date instanceof Date ? date : new Date(date)

  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: SupportedLocale = 'pt-BR'
): string {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  // Determine the appropriate unit
  const absDiff = Math.abs(diffInSeconds)

  if (absDiff < 60) {
    return rtf.format(Math.sign(diffInSeconds) * Math.floor(absDiff), 'second')
  } else if (absDiff < 3600) {
    return rtf.format(Math.sign(diffInSeconds) * Math.floor(absDiff / 60), 'minute')
  } else if (absDiff < 86400) {
    return rtf.format(Math.sign(diffInSeconds) * Math.floor(absDiff / 3600), 'hour')
  } else if (absDiff < 2592000) {
    return rtf.format(Math.sign(diffInSeconds) * Math.floor(absDiff / 86400), 'day')
  } else if (absDiff < 31536000) {
    return rtf.format(Math.sign(diffInSeconds) * Math.floor(absDiff / 2592000), 'month')
  } else {
    return rtf.format(Math.sign(diffInSeconds) * Math.floor(absDiff / 31536000), 'year')
  }
}

/**
 * Format number according to locale
 */
export function formatNumber(
  num: number,
  locale: SupportedLocale = 'pt-BR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num)
}

/**
 * Format number as percentage
 */
export function formatPercent(
  num: number,
  locale: SupportedLocale = 'pt-BR',
  decimals: number = 0
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num / 100)
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale = 'pt-BR',
  currency: string = getCurrencyForLocale(locale)
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Get default currency for locale
 */
export function getCurrencyForLocale(locale: SupportedLocale): string {
  const currencyMap: Record<SupportedLocale, string> = {
    'pt-BR': 'BRL',
    'en-US': 'USD',
    es: 'EUR',
    fr: 'EUR',
    de: 'EUR',
  }
  return currencyMap[locale] || 'USD'
}

/**
 * Format compact number (e.g., 1.5K, 2.3M)
 */
export function formatCompactNumber(
  num: number,
  locale: SupportedLocale = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num)
}

/**
 * Format list with proper conjunctions
 */
export function formatList(
  items: string[],
  locale: SupportedLocale = 'pt-BR',
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, {
    style: 'long',
    type,
  }).format(items)
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(
  seconds: number,
  locale: SupportedLocale = 'pt-BR'
): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}min`)
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`)
  }

  return parts.join(' ')
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(
  phone: string,
  locale: SupportedLocale = 'pt-BR'
): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Brazilian format
  if (locale === 'pt-BR') {
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }
  }

  // US format
  if (locale === 'en-US') {
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
  }

  // Default: return as-is with country code prefix
  return phone
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplayName(
  timezone: string,
  locale: SupportedLocale = 'pt-BR'
): string {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: 'long',
    })
    const parts = formatter.formatToParts(new Date())
    const tzPart = parts.find((part) => part.type === 'timeZoneName')
    return tzPart?.value || timezone
  } catch {
    return timezone
  }
}

/**
 * Get current timezone offset string (e.g., "-03:00")
 */
export function getTimezoneOffset(timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  })
  const parts = formatter.formatToParts(now)
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value || ''
  return offset.replace('GMT', '')
}

/**
 * Plural rules for different locales
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string,
  locale: SupportedLocale = 'pt-BR'
): string {
  const rules = new Intl.PluralRules(locale)
  const rule = rules.select(count)

  return rule === 'one' ? singular : plural
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(
  targetLocale: SupportedLocale,
  displayLocale: SupportedLocale = 'pt-BR'
): string {
  return new Intl.DisplayNames([displayLocale], { type: 'language' }).of(targetLocale) || targetLocale
}

/**
 * Check if locale supports RTL
 */
export function isRTLLocale(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  return rtlLocales.some((rtl) => locale.startsWith(rtl))
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr'
}
