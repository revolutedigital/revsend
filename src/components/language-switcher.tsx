'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe, Check, Loader2 } from 'lucide-react'
import { locales, localeConfig, type Locale } from '@/lib/i18n'

interface LanguageSwitcherProps {
  currentLocale: string
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const changeLocale = async (locale: string) => {
    // Set cookie
    await fetch('/api/locale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locale }),
    })

    // Refresh to apply new locale
    startTransition(() => {
      router.refresh()
      setIsOpen(false)
    })
  }

  const current = localeConfig[currentLocale as Locale] || localeConfig['pt-BR']

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-label={`Idioma atual: ${current.nativeName}. Clique para alterar.`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Globe className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          <span className="mr-1">{current.flag}</span>
          <span className="hidden sm:inline">{current.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((locale) => {
          const config = localeConfig[locale]
          const isSelected = locale === currentLocale

          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => changeLocale(locale)}
              className={isSelected ? 'bg-accent' : ''}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="mr-2" aria-hidden="true">{config.flag}</span>
              <span className="flex-1">{config.nativeName}</span>
              {isSelected && <Check className="h-4 w-4 ml-2" aria-hidden="true" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
