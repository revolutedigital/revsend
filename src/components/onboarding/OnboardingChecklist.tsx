'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronUp, Circle, Rocket, X } from 'lucide-react'
import { ONBOARDING_STEPS, useOnboarding } from '@/hooks/use-onboarding'
import Link from 'next/link'

const STEP_LINKS: Record<string, string> = {
  'welcome': '/dashboard',
  'connect-whatsapp': '/dashboard/whatsapp',
  'create-list': '/dashboard/lists',
  'create-campaign': '/dashboard/campaigns/new',
  'send-message': '/dashboard/campaigns',
}

export function OnboardingChecklist() {
  const {
    completedSteps,
    isCompleted,
    isSkipped,
    progress,
    skipOnboarding,
    isStepCompleted,
  } = useOnboarding()

  const [isExpanded, setIsExpanded] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if completed, skipped, or dismissed
  if (isCompleted || isSkipped || isDismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-xl border border-navy-700 overflow-hidden shadow-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-navy-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-controls="onboarding-content"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-coral/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-coral" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Primeiros passos</h3>
            <p className="text-sm text-slate-400">
              {completedSteps.length}/{ONBOARDING_STEPS.length} concluídos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-mint">{progress}%</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <Progress value={progress} className="h-1" />
      </div>

      {/* Content */}
      {isExpanded && (
        <div id="onboarding-content" className="p-4 pt-3 space-y-2">
          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = isStepCompleted(step.id)
            const isCurrent = completedSteps.length === index

            return (
              <Link
                key={step.id}
                href={STEP_LINKS[step.id] || '/dashboard'}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-all',
                  isComplete
                    ? 'bg-mint/10 border border-mint/20'
                    : isCurrent
                      ? 'bg-coral/10 border border-coral/20'
                      : 'bg-navy-800/30 border border-transparent hover:border-navy-600'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    isComplete
                      ? 'bg-mint text-navy-900'
                      : isCurrent
                        ? 'bg-coral text-white'
                        : 'bg-navy-700 text-slate-400'
                  )}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium',
                      isComplete ? 'text-mint' : isCurrent ? 'text-white' : 'text-slate-300'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-slate-400 line-clamp-1">{step.description}</p>
                </div>
              </Link>
            )
          })}

          {/* Skip button */}
          <div className="pt-2 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4 mr-1" />
              Esconder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-slate-400 hover:text-white"
            >
              Pular tudo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
