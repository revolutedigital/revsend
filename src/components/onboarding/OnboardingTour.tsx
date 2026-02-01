'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  target: string // CSS selector
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    description: 'Veja todas as suas métricas e atividades recentes em um só lugar.',
    position: 'right',
  },
  {
    target: '[data-tour="campaigns"]',
    title: 'Campanhas',
    description: 'Crie e gerencie campanhas de disparo de mensagens no WhatsApp.',
    position: 'right',
  },
  {
    target: '[data-tour="lists"]',
    title: 'Listas de Contatos',
    description: 'Importe seus contatos via CSV e organize em listas segmentadas.',
    position: 'right',
  },
  {
    target: '[data-tour="pipeline"]',
    title: 'Pipeline CRM',
    description: 'Acompanhe seus negócios em um pipeline visual tipo Kanban.',
    position: 'right',
  },
  {
    target: '[data-tour="command-palette"]',
    title: 'Busca Rápida',
    description: 'Use Ctrl+K para buscar qualquer coisa no sistema rapidamente.',
    position: 'bottom',
  },
]

interface OnboardingTourProps {
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const step = TOUR_STEPS[currentStep]

  useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 16,
      })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep, step])

  if (!step) return null

  const isLast = currentStep === TOUR_STEPS.length - 1

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[60] bg-black/40" aria-hidden="true" />

      {/* Tooltip */}
      <div
        className={cn(
          'fixed z-[61] w-80 rounded-xl bg-navy-800 border border-navy-400/30 p-4 shadow-xl',
        )}
        style={{ top: position.top - 40, left: position.left }}
        role="dialog"
        aria-label={`Tour passo ${currentStep + 1} de ${TOUR_STEPS.length}`}
      >
        <button
          onClick={onSkip}
          className="absolute top-2 right-2 p-1 text-navy-300 hover:text-white rounded"
          aria-label="Fechar tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-xs text-navy-300 mb-1">
          {currentStep + 1} / {TOUR_STEPS.length}
        </div>
        <h3 className="text-white font-semibold mb-1">{step.title}</h3>
        <p className="text-sm text-navy-200 mb-4">{step.description}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {isLast ? (
            <Button size="sm" onClick={onComplete}>
              Concluir
            </Button>
          ) : (
            <Button size="sm" onClick={() => setCurrentStep((s) => s + 1)}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
