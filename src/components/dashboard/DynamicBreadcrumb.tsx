'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

// Route name mappings
const ROUTE_NAMES: Record<string, string> = {
  dashboard: 'Início',
  whatsapp: 'WhatsApp',
  lists: 'Listas',
  contacts: 'Contatos',
  campaigns: 'Campanhas',
  new: 'Nova',
  edit: 'Editar',
  templates: 'Templates',
  analytics: 'Analytics',
  settings: 'Configurações',
  security: 'Segurança',
  crm: 'CRM',
  pipeline: 'Pipeline',
  deals: 'Negócios',
  webhooks: 'Webhooks',
  media: 'Mídia',
  'audit-logs': 'Logs de Auditoria',
}

// Routes that should be skipped in breadcrumb
const SKIP_ROUTES = ['(dashboard)']

interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter((seg) => seg && !SKIP_ROUTES.includes(seg))

  const breadcrumbs: BreadcrumbItem[] = []
  let currentPath = ''

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip if it's just an ID (cuid pattern)
    const isCuid = /^c[a-z0-9]{24,}$/i.test(segment)

    if (isCuid) {
      // For IDs, we keep the path but show a generic label
      breadcrumbs.push({
        label: 'Detalhes',
        href: currentPath,
        isLast: index === segments.length - 1,
      })
    } else {
      const label = ROUTE_NAMES[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === segments.length - 1,
      })
    }
  })

  return breadcrumbs
}

interface DynamicBreadcrumbProps {
  className?: string
  showHome?: boolean
}

export function DynamicBreadcrumb({ className, showHome = true }: DynamicBreadcrumbProps) {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  // Don't show breadcrumb on dashboard root
  if (pathname === '/dashboard' || breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav aria-label="Navegação estrutural" className={cn('mb-4', className)}>
      <ol className="flex items-center flex-wrap gap-1 text-sm" role="list">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              aria-label="Ir para o início"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Início</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600 mx-1" aria-hidden="true" />
          </li>
        )}

        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {item.isLast ? (
              <span className="text-white font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <>
                <Link
                  href={item.href}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
                <ChevronRight className="w-4 h-4 text-slate-600 mx-1" aria-hidden="true" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
