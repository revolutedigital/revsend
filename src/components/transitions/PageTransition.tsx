'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/**
 * Simple page transition wrapper using CSS animations
 * Respects prefers-reduced-motion
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [displayedChildren, setDisplayedChildren] = useState(children)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setDisplayedChildren(children)
      setIsVisible(true)
      return
    }

    // Start exit animation
    setIsVisible(false)

    // Wait for exit animation, then update content
    const exitTimer = setTimeout(() => {
      setDisplayedChildren(children)
      // Small delay before enter animation
      const enterTimer = setTimeout(() => {
        setIsVisible(true)
      }, 50)

      return () => clearTimeout(enterTimer)
    }, 150)

    return () => clearTimeout(exitTimer)
  }, [pathname, children])

  // Initial mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      {displayedChildren}
    </div>
  )
}

/**
 * Fade-only transition for modals and overlays
 */
export function FadeTransition({
  children,
  show,
  className,
}: {
  children: ReactNode
  show: boolean
  className?: string
}) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), 200)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!shouldRender) return null

  return (
    <div
      className={cn(
        'transition-opacity duration-200',
        show ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Slide-in transition for sidebars and panels
 */
export function SlideTransition({
  children,
  show,
  direction = 'right',
  className,
}: {
  children: ReactNode
  show: boolean
  direction?: 'left' | 'right' | 'up' | 'down'
  className?: string
}) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!shouldRender) return null

  const translateClass = {
    left: show ? 'translate-x-0' : '-translate-x-full',
    right: show ? 'translate-x-0' : 'translate-x-full',
    up: show ? 'translate-y-0' : '-translate-y-full',
    down: show ? 'translate-y-0' : 'translate-y-full',
  }[direction]

  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-out',
        translateClass,
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Staggered animation for lists
 */
export function StaggeredList({
  children,
  className,
  staggerDelay = 50,
}: {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
}) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setVisibleCount(children.length)
      return
    }

    setVisibleCount(0)
    let count = 0
    const interval = setInterval(() => {
      count++
      setVisibleCount(count)
      if (count >= children.length) {
        clearInterval(interval)
      }
    }, staggerDelay)

    return () => clearInterval(interval)
  }, [children.length, staggerDelay])

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300 ease-out',
            index < visibleCount
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
