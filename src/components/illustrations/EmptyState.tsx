'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RevSendMascot } from '@/components/logo/RevSendMascot'
import {
  FileSpreadsheet,
  MessageSquare,
  Phone,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'

// ==================== EMPTY STATE WRAPPER ====================

interface EmptyStateWrapperProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  showMascot?: boolean
  mascotMood?: 'happy' | 'thinking'
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  showMascot = false,
  mascotMood = 'thinking',
  className,
  children,
}: EmptyStateWrapperProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {showMascot ? (
        <div className="mb-6 animate-fade-in">
          <RevSendMascot
            className="w-24 h-28"
            mood={mascotMood}
            variant="static"
          />
        </div>
      ) : Icon ? (
        <div className="mb-6 p-4 rounded-full bg-navy-800 border border-navy-700 animate-fade-in">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      ) : null}

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-sm mb-6">{description}</p>

      {children}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            action.href ? (
              <Button asChild>
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button variant="outline" asChild>
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ==================== PRE-BUILT EMPTY STATES ====================

export function EmptyContacts() {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum contato ainda"
      description="Importe uma lista de contatos CSV ou adicione contatos manualmente para começar."
      action={{
        label: 'Importar contatos',
        href: '/dashboard/lists/new',
      }}
      secondaryAction={{
        label: 'Adicionar manualmente',
        href: '/dashboard/contacts/new',
      }}
    />
  )
}

export function EmptyLists() {
  return (
    <EmptyState
      icon={FileSpreadsheet}
      title="Nenhuma lista criada"
      description="Crie sua primeira lista de contatos para organizar seus leads."
      action={{
        label: 'Criar lista',
        href: '/dashboard/lists/new',
      }}
      showMascot
      mascotMood="thinking"
    />
  )
}

export function EmptyCampaigns() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Nenhuma campanha criada"
      description="Crie sua primeira campanha para começar a enviar mensagens em massa."
      action={{
        label: 'Criar campanha',
        href: '/dashboard/campaigns/new',
      }}
      showMascot
      mascotMood="happy"
    />
  )
}

export function EmptyWhatsApp() {
  return (
    <EmptyState
      icon={Phone}
      title="Nenhum WhatsApp conectado"
      description="Conecte seu primeiro número de WhatsApp para começar a enviar mensagens."
      action={{
        label: 'Conectar WhatsApp',
        href: '/dashboard/whatsapp',
      }}
      showMascot
      mascotMood="thinking"
    />
  )
}

export function EmptyTemplates() {
  return (
    <EmptyState
      icon={Zap}
      title="Nenhum template salvo"
      description="Crie templates para reutilizar mensagens em suas campanhas."
      action={{
        label: 'Criar template',
        href: '/dashboard/templates/new',
      }}
    />
  )
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      title="Nenhum resultado encontrado"
      description={`Não encontramos resultados para "${query}". Tente usar termos diferentes.`}
      showMascot
      mascotMood="thinking"
    />
  )
}

export function EmptyDeals() {
  return (
    <EmptyState
      title="Nenhum negócio no pipeline"
      description="Adicione seu primeiro negócio para começar a acompanhar suas oportunidades."
      action={{
        label: 'Criar negócio',
        href: '/dashboard/crm/deals/new',
      }}
      showMascot
      mascotMood="happy"
    />
  )
}

// ==================== SVG ILLUSTRATIONS ====================

interface IllustrationProps {
  variant?: "campaigns" | "lists" | "replies" | "default";
  className?: string;
}

export function EmptyStateIllustration({ variant = "default", className = "w-48 h-48" }: IllustrationProps) {
  if (variant === "campaigns") {
    return (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="emptyCoralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7336" />
            <stop offset="100%" stopColor="#FF8F5C" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="80" fill="#101820" opacity="0.3" />

        {/* Envelope base */}
        <path
          d="M50 75L100 110L150 75V140C150 145 146 150 140 150H60C54 150 50 145 50 140V75Z"
          fill="#1A2A40"
          stroke="#2E4A6E"
          strokeWidth="2"
        />

        {/* Envelope flap */}
        <path
          d="M50 75L100 105L150 75L100 55L50 75Z"
          fill="#0F1E32"
          stroke="#2E4A6E"
          strokeWidth="2"
        />

        {/* Sending waves */}
        <path d="M160 85C175 85 185 95 185 110" stroke="#ff7336" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M160 70C185 70 200 85 200 110" stroke="#ff7336" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M160 55C195 55 215 75 215 110" stroke="#ff7336" strokeWidth="2" strokeLinecap="round" opacity="0.2" />

        {/* Sparkles */}
        <circle cx="45" cy="60" r="3" fill="#00D9A5" opacity="0.8" />
        <circle cx="165" cy="140" r="2" fill="#FFD93D" opacity="0.8" />
        <circle cx="35" cy="130" r="2" fill="#ff7336" opacity="0.6" />

        {/* Plus icon suggesting action */}
        <circle cx="100" cy="115" r="15" fill="url(#emptyCoralGrad)" />
        <path d="M100 108V122M93 115H107" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === "lists") {
    return (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="emptyMintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9A5" />
            <stop offset="100%" stopColor="#00B388" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="80" fill="#101820" opacity="0.3" />

        {/* Document/list */}
        <rect x="55" y="40" width="90" height="120" rx="8" fill="#1A2A40" stroke="#2E4A6E" strokeWidth="2" />

        {/* Lines representing list items */}
        <rect x="70" y="60" width="40" height="6" rx="3" fill="#2E4A6E" />
        <rect x="70" y="78" width="60" height="6" rx="3" fill="#2E4A6E" />
        <rect x="70" y="96" width="50" height="6" rx="3" fill="#2E4A6E" />
        <rect x="70" y="114" width="55" height="6" rx="3" fill="#2E4A6E" opacity="0.5" />
        <rect x="70" y="132" width="35" height="6" rx="3" fill="#2E4A6E" opacity="0.3" />

        {/* User icons */}
        <circle cx="160" cy="70" r="12" fill="#0F1E32" stroke="#00D9A5" strokeWidth="2" />
        <circle cx="160" cy="67" r="4" fill="#00D9A5" />
        <path d="M152 78C152 74 156 72 160 72C164 72 168 74 168 78" stroke="#00D9A5" strokeWidth="2" strokeLinecap="round" />

        <circle cx="170" cy="100" r="10" fill="#0F1E32" stroke="#ff7336" strokeWidth="2" opacity="0.7" />
        <circle cx="150" cy="120" r="8" fill="#0F1E32" stroke="#FFD93D" strokeWidth="2" opacity="0.5" />

        {/* Upload arrow */}
        <circle cx="100" cy="160" r="18" fill="url(#emptyMintGrad)" />
        <path d="M100 168V152M93 158L100 152L107 158" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "replies") {
    return (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Background circle */}
        <circle cx="100" cy="100" r="80" fill="#101820" opacity="0.3" />

        {/* Chat bubbles */}
        <rect x="40" y="50" width="80" height="45" rx="10" fill="#1A2A40" stroke="#2E4A6E" strokeWidth="2" />
        <polygon points="55,95 65,95 55,110" fill="#1A2A40" stroke="#2E4A6E" strokeWidth="2" />
        <rect x="55" y="65" width="50" height="5" rx="2.5" fill="#2E4A6E" />
        <rect x="55" y="78" width="35" height="5" rx="2.5" fill="#2E4A6E" />

        <rect x="80" y="100" width="80" height="45" rx="10" fill="#0F1E32" stroke="#ff7336" strokeWidth="2" opacity="0.4" />
        <polygon points="145,145 135,145 145,160" fill="#0F1E32" stroke="#ff7336" strokeWidth="2" opacity="0.4" />

        {/* Dots indicating waiting */}
        <circle cx="100" cy="122" r="4" fill="#ff7336" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="115" cy="122" r="4" fill="#ff7336" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" begin="0.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="130" cy="122" r="4" fill="#ff7336" opacity="0.2">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
        </circle>

        {/* Sparkle */}
        <circle cx="160" cy="60" r="3" fill="#00D9A5" />
        <circle cx="35" cy="140" r="2" fill="#FFD93D" />
      </svg>
    );
  }

  // Default
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7336" />
          <stop offset="100%" stopColor="#FF8F5C" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="100" cy="100" r="80" fill="#101820" opacity="0.3" />

      {/* Waves */}
      <path d="M60 100C60 78 78 60 100 60" stroke="#ff7336" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <path d="M45 100C45 70 70 45 100 45" stroke="#ff7336" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      <path d="M30 100C30 61 61 30 100 30" stroke="#ff7336" strokeWidth="2" strokeLinecap="round" opacity="0.15" />

      {/* Center icon */}
      <circle cx="100" cy="100" r="30" fill="#1A2A40" stroke="#2E4A6E" strokeWidth="2" />
      <circle cx="100" cy="100" r="12" fill="url(#defaultGrad)" />

      {/* Accent */}
      <circle cx="140" cy="70" r="5" fill="#00D9A5" />

      {/* Sparkles */}
      <circle cx="50" cy="60" r="3" fill="#FFD93D" opacity="0.8" />
      <circle cx="155" cy="140" r="2" fill="#ff7336" opacity="0.6" />
    </svg>
  );
}
