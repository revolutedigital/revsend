'use client'

import { useEffect, useState } from 'react'

export function useTranslation() {
  const [messages, setMessages] = useState<Record<string, any>>({})
  const [locale, setLocale] = useState<string>('pt-BR')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    try {
      // Get current locale
      const response = await fetch('/api/locale')
      const data = await response.json()
      const currentLocale = data.locale || 'pt-BR'

      // Load messages
      const messagesModule = await import(`../../messages/${currentLocale}.json`)
      setMessages(messagesModule.default)
      setLocale(currentLocale)
    } catch (error) {
      console.error('Failed to load messages:', error)
      // Fallback to pt-BR
      const messagesModule = await import(`../../messages/pt-BR.json`)
      setMessages(messagesModule.default)
      setLocale('pt-BR')
    } finally {
      setIsLoading(false)
    }
  }

  function t(key: string, values?: Record<string, string | number>): string {
    // Navigate through nested keys (e.g., "auth.loginTitle")
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) break
    }

    if (typeof value !== 'string') {
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

  return { t, locale, isLoading }
}
