'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null)

export function useAnnounce() {
  const context = useContext(AnnouncerContext)
  if (!context) {
    // Return a no-op function if used outside provider
    return {
      announce: () => {},
    }
  }
  return context
}

interface AnnouncerProviderProps {
  children: React.ReactNode
}

export function AnnouncerProvider({ children }: AnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set the message based on priority
    if (priority === 'assertive') {
      setAssertiveMessage('')
      // Small delay to ensure screen readers pick up the change
      setTimeout(() => {
        setAssertiveMessage(message)
      }, 50)
    } else {
      setPoliteMessage('')
      setTimeout(() => {
        setPoliteMessage(message)
      }, 50)
    }

    // Clear message after announcement
    timeoutRef.current = setTimeout(() => {
      setPoliteMessage('')
      setAssertiveMessage('')
    }, 1000)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements - for non-critical updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements - for critical updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  )
}

/**
 * Standalone Announcer component for layouts without provider
 * Uses a global store pattern for announcements
 */
let globalAnnounce: ((message: string, priority?: 'polite' | 'assertive') => void) | null = null

export function setGlobalAnnounce(fn: typeof globalAnnounce) {
  globalAnnounce = fn
}

export function announceGlobal(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (globalAnnounce) {
    globalAnnounce(message, priority)
  }
}

export function Announcer() {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (priority === 'assertive') {
        setAssertiveMessage('')
        setTimeout(() => setAssertiveMessage(message), 50)
      } else {
        setPoliteMessage('')
        setTimeout(() => setPoliteMessage(message), 50)
      }

      timeoutRef.current = setTimeout(() => {
        setPoliteMessage('')
        setAssertiveMessage('')
      }, 1000)
    }

    setGlobalAnnounce(announce)

    return () => {
      setGlobalAnnounce(null)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Polite live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive live region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  )
}
