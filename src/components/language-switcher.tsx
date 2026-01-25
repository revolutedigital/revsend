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
import { Globe } from 'lucide-react'

interface LanguageSwitcherProps {
  currentLocale: string
}

const languages = {
  'pt-BR': {
    name: 'Português (BR)',
    flag: '🇧🇷',
  },
  'en-US': {
    name: 'English (US)',
    flag: '🇺🇸',
  },
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

  const current = languages[currentLocale as keyof typeof languages] || languages['pt-BR']

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <Globe className="h-4 w-4 mr-2" />
          {current.flag} {current.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([locale, lang]) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale)}
            className={locale === currentLocale ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
