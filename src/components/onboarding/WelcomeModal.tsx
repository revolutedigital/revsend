'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RevSendMascotCelebrating } from '@/components/logo/RevSendMascot'
import { ArrowRight, Sparkles } from 'lucide-react'

interface WelcomeModalProps {
  open: boolean
  onStart: () => void
  onSkip: () => void
}

export function WelcomeModal({ open, onStart, onSkip }: WelcomeModalProps) {
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
            Bem-vindo ao RevSend! <Sparkles className="inline h-5 w-5 text-gold" />
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Sua plataforma de prospecção ativa via WhatsApp. Vamos configurar tudo em poucos minutos!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-navy-800/50 rounded-lg p-4 border border-navy-700">
            <h3 className="font-semibold text-white mb-2">O que você vai conseguir:</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-mint/20 text-mint flex items-center justify-center text-xs">1</span>
                Conectar múltiplos números de WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-mint/20 text-mint flex items-center justify-center text-xs">2</span>
                Importar listas de contatos facilmente
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-mint/20 text-mint flex items-center justify-center text-xs">3</span>
                Criar campanhas personalizadas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-mint/20 text-mint flex items-center justify-center text-xs">4</span>
                Acompanhar métricas em tempo real
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-slate-400 hover:text-white order-2 sm:order-1"
          >
            Já conheço, pular
          </Button>
          <Button onClick={onStart} className="order-1 sm:order-2">
            Começar tour
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
