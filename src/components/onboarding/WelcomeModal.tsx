'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RevSendMascotCelebrating } from '@/components/logo/RevSendMascot'
import { ArrowRight, Sparkles, Users, BarChart3, MessageSquare, Settings } from 'lucide-react'

interface WelcomeModalProps {
  open: boolean
  onStart: () => void
  onSkip: () => void
  role?: string
  isMaster?: boolean
  organizationName?: string
}

// Content for each role
const ROLE_CONTENT = {
  gerente: {
    title: 'Bem-vindo ao RevSend!',
    subtitle: 'Sua plataforma de prospecção ativa via WhatsApp. Vamos configurar tudo em poucos minutos!',
    features: [
      { icon: MessageSquare, text: 'Conectar múltiplos números de WhatsApp' },
      { icon: Users, text: 'Importar listas de contatos facilmente' },
      { icon: BarChart3, text: 'Criar campanhas personalizadas' },
      { icon: Settings, text: 'Acompanhar métricas em tempo real' },
    ],
    skipText: 'Já conheço, pular',
    startText: 'Começar tour',
  },
  vendedor: {
    title: 'Bem-vindo à equipe!',
    subtitle: 'Seu gerente já configurou o RevSend para você. Vamos conhecer suas ferramentas de vendas!',
    features: [
      { icon: Users, text: 'Visualizar seus leads atribuídos' },
      { icon: BarChart3, text: 'Acompanhar o pipeline de vendas' },
      { icon: MessageSquare, text: 'Ver campanhas e respostas' },
      { icon: Settings, text: 'Gerenciar suas tarefas e atividades' },
    ],
    skipText: 'Já conheço, pular',
    startText: 'Ver minhas ferramentas',
  },
  master: {
    title: 'Bem-vindo, Master!',
    subtitle: 'Você tem acesso total ao sistema. Vamos conhecer o painel administrativo!',
    features: [
      { icon: Settings, text: 'Gerenciar todas as organizações' },
      { icon: Users, text: 'Administrar usuários e permissões' },
      { icon: BarChart3, text: 'Visualizar métricas globais' },
      { icon: MessageSquare, text: 'Monitorar atividade do sistema' },
    ],
    skipText: 'Já conheço, pular',
    startText: 'Ver painel admin',
  },
}

export function WelcomeModal({
  open,
  onStart,
  onSkip,
  role = 'gerente',
  isMaster = false,
  organizationName = '',
}: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Determine which content to show
  const contentKey = isMaster ? 'master' : (role === 'vendedor' ? 'vendedor' : 'gerente')
  const content = ROLE_CONTENT[contentKey]

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('revsend_onboarding_hidden', 'true')
    }
    onSkip()
  }

  const handleStart = () => {
    if (dontShowAgain) {
      localStorage.setItem('revsend_onboarding_hidden', 'true')
    }
    onStart()
  }

  // Personalize title for vendedor
  const title = role === 'vendedor' && organizationName
    ? `Bem-vindo à ${organizationName}!`
    : content.title

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <RevSendMascotCelebrating className="w-24 h-28" />
          </div>
          <DialogTitle className="text-2xl font-display text-center">
            {title} <Sparkles className="inline h-5 w-5 text-gold" />
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {content.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-navy-800/50 rounded-lg p-4 border border-navy-700">
            <h3 className="font-semibold text-white mb-2">
              {role === 'vendedor' ? 'Suas ferramentas:' : 'O que você vai conseguir:'}
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {content.features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-mint/20 text-mint flex items-center justify-center">
                      <Icon className="h-3 w-3" />
                    </span>
                    {feature.text}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Show additional info for vendedor */}
          {role === 'vendedor' && (
            <div className="bg-coral/10 rounded-lg p-3 border border-coral/20">
              <p className="text-sm text-coral">
                <strong>Dica:</strong> Você pode ver apenas seus próprios deals.
                Para dúvidas, fale com seu gerente.
              </p>
            </div>
          )}

          {/* Show additional info for master */}
          {isMaster && (
            <div className="bg-gold/10 rounded-lg p-3 border border-gold/20">
              <p className="text-sm text-gold">
                <strong>Modo Master:</strong> Você pode acessar qualquer organização
                e todas as funcionalidades do sistema.
              </p>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="rounded border-navy-400 bg-navy-600 text-coral focus:ring-coral/30 h-4 w-4"
          />
          <span className="text-sm text-slate-400">Não mostrar novamente</span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-slate-400 hover:text-white order-2 sm:order-1"
          >
            {content.skipText}
          </Button>
          <Button onClick={handleStart} className="order-1 sm:order-2">
            {content.startText}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
