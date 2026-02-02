'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
}

interface ConfettiProps {
  active: boolean
  duration?: number
  particleCount?: number
  colors?: string[]
  onComplete?: () => void
}

const DEFAULT_COLORS = [
  '#ff7336', // coral
  '#00D9A5', // mint
  '#FFD93D', // gold
  '#FF8F5C', // coral light
  '#4FFFCB', // mint light
  '#FFFFFF', // white
]

export function Confetti({
  active,
  duration = 3000,
  particleCount = 100,
  colors = DEFAULT_COLORS,
  onComplete,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)

  const createParticle = useCallback(
    (canvas: HTMLCanvasElement): Particle => {
      const angle = Math.random() * Math.PI * 2
      const velocity = 8 + Math.random() * 8

      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      }
    },
    [colors]
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gravity = 0.3
    const friction = 0.99
    let activeParticles = 0

    particlesRef.current.forEach((particle) => {
      if (particle.opacity <= 0) return

      activeParticles++

      // Update physics
      particle.vy += gravity
      particle.vx *= friction
      particle.vy *= friction
      particle.x += particle.vx
      particle.y += particle.vy
      particle.rotation += particle.rotationSpeed
      particle.opacity -= 0.008

      // Draw particle
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)
      ctx.globalAlpha = Math.max(0, particle.opacity)
      ctx.fillStyle = particle.color
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6)
      ctx.restore()
    })

    if (activeParticles > 0) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      setIsActive(false)
      onComplete?.()
    }
  }, [onComplete])

  const startConfetti = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Resize canvas
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create particles
    particlesRef.current = Array.from({ length: particleCount }, () => createParticle(canvas))

    setIsActive(true)
    animate()
  }, [particleCount, createParticle, animate])

  useEffect(() => {
    if (active && !isActive) {
      startConfetti()

      // Auto-stop after duration
      const timeout = setTimeout(() => {
        // Let particles fade out naturally
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [active, isActive, startConfetti, duration])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  if (!isActive && !active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  )
}

/**
 * Hook for triggering confetti
 */
export function useConfetti() {
  const [isActive, setIsActive] = useState(false)

  const fire = useCallback(() => {
    setIsActive(true)
  }, [])

  const handleComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  const ConfettiComponent = useCallback(
    () => <Confetti active={isActive} onComplete={handleComplete} />,
    [isActive, handleComplete]
  )

  return { fire, Confetti: ConfettiComponent }
}

/**
 * Success celebration with confetti burst from bottom
 */
export function SuccessCelebration({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  return (
    <Confetti
      active={active}
      particleCount={150}
      colors={['#00D9A5', '#4FFFCB', '#FFFFFF', '#00B388']}
      duration={4000}
      onComplete={onComplete}
    />
  )
}

/**
 * Campaign launch celebration
 */
export function CampaignLaunchCelebration({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  return (
    <Confetti
      active={active}
      particleCount={200}
      colors={['#ff7336', '#FF8F5C', '#FFD93D', '#00D9A5', '#FFFFFF']}
      duration={5000}
      onComplete={onComplete}
    />
  )
}
