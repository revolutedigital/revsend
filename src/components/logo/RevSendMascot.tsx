'use client'

import { useEffect, useState } from 'react'

interface RevSendMascotProps {
  className?: string
  variant?: 'static' | 'animated' | 'mini'
  mood?: 'happy' | 'thinking' | 'celebrating'
}

/**
 * RevSend Mascot Component
 * A rocket ship character that represents speed and messaging
 */
export function RevSendMascot({
  className = 'w-32 h-32',
  variant = 'static',
  mood = 'happy',
}: RevSendMascotProps) {
  const [bounce, setBounce] = useState(0)

  // Animation for animated variant
  useEffect(() => {
    if (variant !== 'animated') return

    const interval = setInterval(() => {
      setBounce((prev) => (prev + 1) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [variant])

  const bounceOffset = variant === 'animated' ? Math.sin((bounce * Math.PI) / 180) * 3 : 0
  const isThinking = mood === 'thinking'
  const isCelebrating = mood === 'celebrating'

  if (variant === 'mini') {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="RevSend mascote"
      >
        {/* Circle background */}
        <circle cx="24" cy="24" r="22" fill="#0A1628" />
        <circle cx="24" cy="24" r="20" stroke="#FF6B35" strokeWidth="2" fill="none" />

        {/* Rocket body */}
        <path
          d="M12 24 L20 16 L20 20 L36 20 L36 28 L20 28 L20 32 L12 24Z"
          fill="#FF6B35"
        />

        {/* Speed lines */}
        <path d="M6 20 L14 20" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <path d="M4 24 L12 24" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        <path d="M6 28 L14 28" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

        {/* Target dot */}
        <circle cx="38" cy="24" r="4" fill="#00D9A5" />
        <circle cx="38" cy="24" r="2" fill="white" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="RevSend mascote"
      style={{ transform: `translateY(${bounceOffset}px)` }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="mascot-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8F5C" />
          <stop offset="50%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#E85520" />
        </linearGradient>

        <linearGradient id="mascot-glow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B388" />
          <stop offset="100%" stopColor="#00D9A5" />
        </linearGradient>

        <filter id="mascot-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0A1628" floodOpacity="0.3" />
        </filter>

        {/* Eye glow */}
        <filter id="eye-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shadow base */}
      <ellipse cx="60" cy="130" rx="30" ry="8" fill="#0A1628" opacity="0.2" />

      {/* Main body - Rocket shape */}
      <g filter="url(#mascot-shadow)">
        {/* Body */}
        <path
          d="M60 10 C40 10, 25 30, 25 55 L25 85 C25 95, 35 105, 60 105 C85 105, 95 95, 95 85 L95 55 C95 30, 80 10, 60 10Z"
          fill="url(#mascot-body)"
        />

        {/* Belly panel */}
        <ellipse cx="60" cy="70" rx="20" ry="25" fill="#0A1628" opacity="0.15" />

        {/* Window/Face area */}
        <ellipse cx="60" cy="45" rx="22" ry="20" fill="#0F1E32" />
        <ellipse cx="60" cy="45" rx="20" ry="18" fill="#1A2D4A" />

        {/* Eyes */}
        <g filter="url(#eye-glow)">
          {isThinking ? (
            <>
              {/* Thinking eyes - looking up */}
              <ellipse cx="50" cy="42" rx="6" ry="7" fill="white" />
              <ellipse cx="70" cy="42" rx="6" ry="7" fill="white" />
              <circle cx="51" cy="39" r="3" fill="#0A1628" />
              <circle cx="71" cy="39" r="3" fill="#0A1628" />
              <circle cx="52" cy="38" r="1" fill="white" />
              <circle cx="72" cy="38" r="1" fill="white" />
            </>
          ) : isCelebrating ? (
            <>
              {/* Celebrating eyes - happy arches */}
              <path d="M44 44 Q50 38 56 44" stroke="#00D9A5" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M64 44 Q70 38 76 44" stroke="#00D9A5" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              {/* Normal happy eyes */}
              <ellipse cx="50" cy="43" rx="6" ry="7" fill="white" />
              <ellipse cx="70" cy="43" rx="6" ry="7" fill="white" />
              <circle cx="52" cy="44" r="3" fill="#0A1628" />
              <circle cx="72" cy="44" r="3" fill="#0A1628" />
              <circle cx="53" cy="43" r="1" fill="white" />
              <circle cx="73" cy="43" r="1" fill="white" />
            </>
          )}
        </g>

        {/* Smile */}
        {isCelebrating ? (
          <path
            d="M48 55 Q60 68 72 55"
            stroke="#00D9A5"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <path
            d="M50 55 Q60 62 70 55"
            stroke="#00D9A5"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Blush marks when celebrating */}
        {isCelebrating && (
          <>
            <ellipse cx="38" cy="50" rx="5" ry="3" fill="#FF8F5C" opacity="0.6" />
            <ellipse cx="82" cy="50" rx="5" ry="3" fill="#FF8F5C" opacity="0.6" />
          </>
        )}

        {/* Wings/Fins */}
        <path
          d="M25 70 L10 85 L10 95 L25 85"
          fill="url(#mascot-body)"
        />
        <path
          d="M95 70 L110 85 L110 95 L95 85"
          fill="url(#mascot-body)"
        />

        {/* Flame/Propulsion */}
        <g className={variant === 'animated' ? 'animate-pulse' : ''}>
          <path
            d="M45 105 L60 125 L75 105"
            fill="url(#mascot-glow)"
            opacity="0.9"
          />
          <path
            d="M50 105 L60 118 L70 105"
            fill="#4FFFCB"
            opacity="0.8"
          />
        </g>

        {/* Speed lines (animated) */}
        {variant === 'animated' && (
          <g className="animate-pulse">
            <path d="M5 45 L20 45" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M2 55 L18 55" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
            <path d="M5 65 L20 65" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {/* Antenna */}
        <circle cx="60" cy="8" r="4" fill="#FFD93D" />
        <path d="M60 12 L60 20" stroke="#FFD93D" strokeWidth="2" />

        {/* Stars around when celebrating */}
        {isCelebrating && (
          <>
            <path d="M15 25 L17 30 L22 30 L18 33 L20 38 L15 35 L10 38 L12 33 L8 30 L13 30Z" fill="#FFD93D" opacity="0.8" />
            <path d="M100 20 L101 23 L104 23 L102 25 L103 28 L100 26 L97 28 L98 25 L96 23 L99 23Z" fill="#FFD93D" opacity="0.6" />
            <path d="M105 60 L106 62 L108 62 L107 63 L107 65 L105 64 L103 65 L103 63 L102 62 L104 62Z" fill="#00D9A5" opacity="0.7" />
          </>
        )}

        {/* Thinking bubble */}
        {isThinking && (
          <>
            <circle cx="95" cy="25" r="8" fill="white" opacity="0.9" />
            <circle cx="88" cy="35" r="5" fill="white" opacity="0.7" />
            <circle cx="83" cy="42" r="3" fill="white" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  )
}

/**
 * Export variants for easy access
 */
export function RevSendMascotMini({ className = 'w-8 h-8' }: { className?: string }) {
  return <RevSendMascot className={className} variant="mini" />
}

export function RevSendMascotAnimated({ className = 'w-32 h-32', mood = 'happy' as const }) {
  return <RevSendMascot className={className} variant="animated" mood={mood} />
}

export function RevSendMascotCelebrating({ className = 'w-32 h-32' }) {
  return <RevSendMascot className={className} variant="animated" mood="celebrating" />
}
