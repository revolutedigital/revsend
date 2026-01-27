'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useOnboarding, type OnboardingStep } from '@/hooks/use-onboarding'
import { WelcomeModal } from './WelcomeModal'

interface OnboardingContextValue {
  currentStep: number
  currentStepData: OnboardingStep | undefined
  completedSteps: string[]
  isSkipped: boolean
  isCompleted: boolean
  isLoading: boolean
  progress: number
  steps: OnboardingStep[]
  completeStep: (stepId: string) => void
  goToStep: (stepIndex: number) => void
  skipOnboarding: () => void
  resetOnboarding: () => void
  isStepCompleted: (stepId: string) => boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboardingContext() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider')
  }
  return context
}

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const onboarding = useOnboarding()

  const handleStart = () => {
    onboarding.dismissWelcome()
  }

  const handleSkip = () => {
    onboarding.skipOnboarding()
  }

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
      {!onboarding.isLoading && (
        <WelcomeModal
          open={onboarding.showWelcome}
          onStart={handleStart}
          onSkip={handleSkip}
        />
      )}
    </OnboardingContext.Provider>
  )
}
