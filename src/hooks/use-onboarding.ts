'use client'

import { useCallback, useEffect, useState } from 'react'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlight
  action?: () => void
  isCompleted?: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao RevSend!',
    description: 'Vamos configurar sua conta em poucos passos para você começar a enviar mensagens.',
  },
  {
    id: 'connect-whatsapp',
    title: 'Conecte seu WhatsApp',
    description: 'Escaneie o QR Code para conectar seu número de WhatsApp.',
    target: '[data-onboarding="whatsapp"]',
  },
  {
    id: 'create-list',
    title: 'Crie sua primeira lista',
    description: 'Importe contatos de um arquivo CSV ou adicione manualmente.',
    target: '[data-onboarding="lists"]',
  },
  {
    id: 'create-campaign',
    title: 'Crie sua primeira campanha',
    description: 'Configure mensagens e selecione os contatos para disparo.',
    target: '[data-onboarding="campaigns"]',
  },
  {
    id: 'send-message',
    title: 'Envie sua primeira mensagem',
    description: 'Inicie a campanha e acompanhe o progresso em tempo real.',
    target: '[data-onboarding="start-campaign"]',
  },
]

interface OnboardingState {
  currentStep: number
  completedSteps: string[]
  isSkipped: boolean
  isCompleted: boolean
}

const STORAGE_KEY = 'revsend_onboarding'

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
    isSkipped: false,
    isCompleted: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setState(parsed)
        setShowWelcome(false)
      } catch {
        // Invalid data, show welcome
        setShowWelcome(true)
      }
    } else {
      // First time user
      setShowWelcome(true)
    }
    setIsLoading(false)
  }, [])

  // Save state to localStorage
  const saveState = useCallback((newState: OnboardingState) => {
    setState(newState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
  }, [])

  // Mark current step as complete and advance
  const completeStep = useCallback((stepId: string) => {
    setState((prev) => {
      const newCompletedSteps = prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId]

      const nextStep = Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1)
      const isCompleted = newCompletedSteps.length >= ONBOARDING_STEPS.length

      const newState = {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: nextStep,
        isCompleted,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }, [])

  // Go to specific step
  const goToStep = useCallback((stepIndex: number) => {
    setState((prev) => {
      const newState = {
        ...prev,
        currentStep: Math.max(0, Math.min(stepIndex, ONBOARDING_STEPS.length - 1)),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    })
  }, [])

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      ...state,
      isSkipped: true,
      isCompleted: true,
    }
    saveState(newState)
    setShowWelcome(false)
  }, [state, saveState])

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      currentStep: 0,
      completedSteps: [],
      isSkipped: false,
      isCompleted: false,
    }
    saveState(newState)
    setShowWelcome(true)
  }, [saveState])

  // Dismiss welcome modal
  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
  }, [])

  // Get current step data
  const currentStepData = ONBOARDING_STEPS[state.currentStep]

  // Check if a specific step is completed
  const isStepCompleted = useCallback(
    (stepId: string) => state.completedSteps.includes(stepId),
    [state.completedSteps]
  )

  // Calculate progress percentage
  const progress = Math.round((state.completedSteps.length / ONBOARDING_STEPS.length) * 100)

  return {
    // State
    currentStep: state.currentStep,
    currentStepData,
    completedSteps: state.completedSteps,
    isSkipped: state.isSkipped,
    isCompleted: state.isCompleted,
    isLoading,
    showWelcome,
    progress,
    steps: ONBOARDING_STEPS,

    // Actions
    completeStep,
    goToStep,
    skipOnboarding,
    resetOnboarding,
    dismissWelcome,
    isStepCompleted,
  }
}
