'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlight
  action?: () => void
  isCompleted?: boolean
}

// Full onboarding steps for Gerente (admins who set up the org)
export const GERENTE_ONBOARDING_STEPS: OnboardingStep[] = [
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

// Simplified onboarding for Vendedor (salespeople invited to the org)
export const VENDEDOR_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome-vendedor',
    title: 'Bem-vindo à equipe!',
    description: 'Seu gerente já configurou o RevSend. Vamos fazer um tour rápido pelas suas ferramentas.',
  },
  {
    id: 'view-deals',
    title: 'Seus Deals',
    description: 'Aqui você vê os leads atribuídos a você. Acompanhe o progresso e gerencie suas negociações.',
    target: '[data-onboarding="deals"]',
  },
  {
    id: 'view-pipeline',
    title: 'Pipeline de Vendas',
    description: 'Arraste seus deals entre as etapas conforme avança nas negociações.',
    target: '[data-onboarding="pipeline"]',
  },
  {
    id: 'view-campaigns',
    title: 'Campanhas Ativas',
    description: 'Veja as campanhas em andamento e as respostas dos seus leads.',
    target: '[data-onboarding="campaigns"]',
  },
]

// Master-specific onboarding (global admin)
export const MASTER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome-master',
    title: 'Bem-vindo, Master!',
    description: 'Você tem acesso total ao sistema. Vamos conhecer as ferramentas de administração.',
  },
  {
    id: 'admin-panel',
    title: 'Painel Admin',
    description: 'Gerencie todas as organizações e usuários do sistema.',
    target: '[data-onboarding="admin"]',
  },
  {
    id: 'org-management',
    title: 'Organizações',
    description: 'Crie e gerencie organizações, adicione membros e configure planos.',
    target: '[data-onboarding="organizations"]',
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
  const { data: session } = useSession()
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
    isSkipped: false,
    isCompleted: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  // Get role from session
  const role = session?.user?.role || 'vendedor'
  const isMaster = session?.user?.isMaster || false
  // Note: organizationName could be fetched separately if needed
  const organizationName = ''

  // Get steps based on role
  const getStepsForRole = useCallback(() => {
    if (isMaster && !session?.user?.currentOrgId) {
      return MASTER_ONBOARDING_STEPS
    }
    if (role === 'gerente') {
      return GERENTE_ONBOARDING_STEPS
    }
    return VENDEDOR_ONBOARDING_STEPS
  }, [role, isMaster, session?.user?.currentOrgId])

  const ONBOARDING_STEPS = getStepsForRole()

  // Generate storage key based on role to have separate onboarding tracks
  const getStorageKey = useCallback(() => {
    if (isMaster && !session?.user?.currentOrgId) {
      return `${STORAGE_KEY}_master`
    }
    return `${STORAGE_KEY}_${role}`
  }, [role, isMaster, session?.user?.currentOrgId])

  // Load state from localStorage on mount
  useEffect(() => {
    const storageKey = getStorageKey()
    const hidden = localStorage.getItem('revsend_onboarding_hidden')
    if (hidden === 'true') {
      setShowWelcome(false)
      setIsLoading(false)
      return
    }

    const saved = localStorage.getItem(storageKey)
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
  }, [getStorageKey])

  // Save state to localStorage
  const saveState = useCallback((newState: OnboardingState) => {
    setState(newState)
    localStorage.setItem(getStorageKey(), JSON.stringify(newState))
  }, [getStorageKey])

  // Mark current step as complete and advance
  const completeStep = useCallback((stepId: string) => {
    setState((prev) => {
      const steps = getStepsForRole()
      const newCompletedSteps = prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId]

      const nextStep = Math.min(prev.currentStep + 1, steps.length - 1)
      const isCompleted = newCompletedSteps.length >= steps.length

      const newState = {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: nextStep,
        isCompleted,
      }

      localStorage.setItem(getStorageKey(), JSON.stringify(newState))
      return newState
    })
  }, [getStepsForRole, getStorageKey])

  // Go to specific step
  const goToStep = useCallback((stepIndex: number) => {
    setState((prev) => {
      const steps = getStepsForRole()
      const newState = {
        ...prev,
        currentStep: Math.max(0, Math.min(stepIndex, steps.length - 1)),
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(newState))
      return newState
    })
  }, [getStepsForRole, getStorageKey])

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

    // Role info
    role,
    isMaster,
    organizationName,

    // Actions
    completeStep,
    goToStep,
    skipOnboarding,
    resetOnboarding,
    dismissWelcome,
    isStepCompleted,
  }
}
