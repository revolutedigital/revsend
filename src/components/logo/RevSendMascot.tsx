'use client'

import { useEffect, useState, useId } from 'react'

interface RevSendMascotProps {
  className?: string
  variant?: 'static' | 'animated' | 'mini'
  mood?: 'happy' | 'thinking' | 'celebrating'
}

/**
 * RevSend Mascot — Flash, the Cheetah
 * Premium SVG mascot with advanced filters, gradients, CSS animations,
 * fur texture patterns, ambient glow, and expressive moods.
 */
export function RevSendMascot({
  className = 'w-32 h-32',
  variant = 'static',
  mood = 'happy',
}: RevSendMascotProps) {
  const [frame, setFrame] = useState(0)
  const uid = useId().replace(/:/g, '')

  useEffect(() => {
    if (variant !== 'animated') return
    const interval = setInterval(() => setFrame((p) => (p + 1) % 360), 40)
    return () => clearInterval(interval)
  }, [variant])

  const isAnimated = variant === 'animated'
  const bodyY = isAnimated ? Math.sin((frame * Math.PI) / 180) * 2.5 : 0
  const tailWag = isAnimated ? Math.sin((frame * 3 * Math.PI) / 180) * 6 : 0
  const earTwitch = isAnimated ? Math.sin((frame * 2 * Math.PI) / 180) * 2 : 0
  const breathe = isAnimated ? 1 + Math.sin((frame * Math.PI) / 180) * 0.015 : 1
  const isThinking = mood === 'thinking'
  const isCelebrating = mood === 'celebrating'

  // Unique IDs to avoid SVG filter/gradient conflicts when multiple mascots render
  const id = (s: string) => `${s}-${uid}`

  /* ─── MINI ─── */
  if (variant === 'mini') {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Flash, o guepardo do RevSend"
      >
        <defs>
          <radialGradient id={id('miniBg')} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1A2D4A" />
            <stop offset="100%" stopColor="#101820" />
          </radialGradient>
          <linearGradient id={id('miniFur')} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFBE8A" />
            <stop offset="100%" stopColor="#ff7336" />
          </linearGradient>
          <filter id={id('miniGlow')} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.5" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* BG circle with radial gradient */}
        <circle cx="24" cy="24" r="22" fill={`url(#${id('miniBg')})`} />
        <circle cx="24" cy="24" r="20.5" stroke="#ff7336" strokeWidth="1.5" fill="none" opacity="0.6" />

        <g filter={`url(#${id('miniGlow')})`}>
          {/* Head */}
          <ellipse cx="24" cy="22" rx="11" ry="10" fill={`url(#${id('miniFur')})`} />

          {/* Ears with inner detail */}
          <path d="M15.5 16 L13 8.5 L19.5 14Z" fill={`url(#${id('miniFur')})`} />
          <path d="M32.5 16 L35 8.5 L28.5 14Z" fill={`url(#${id('miniFur')})`} />
          <path d="M16 14.5 L14.5 10 L18.5 13.5Z" fill="#FFC9B1" />
          <path d="M32 14.5 L33.5 10 L29.5 13.5Z" fill="#FFC9B1" />

          {/* Muzzle lighter area */}
          <ellipse cx="24" cy="25" rx="7" ry="5" fill="#FFE4D8" opacity="0.45" />

          {/* Eyes — large expressive anime-style */}
          <ellipse cx="20" cy="20.5" rx="3" ry="3.4" fill="white" />
          <ellipse cx="28" cy="20.5" rx="3" ry="3.4" fill="white" />
          {/* Iris with gradient look */}
          <circle cx="20.8" cy="21" r="1.8" fill="#101820" />
          <circle cx="28.8" cy="21" r="1.8" fill="#101820" />
          {/* Highlights */}
          <circle cx="21.3" cy="20" r="0.7" fill="white" />
          <circle cx="29.3" cy="20" r="0.7" fill="white" />
          <circle cx="20.2" cy="21.8" r="0.35" fill="white" opacity="0.6" />
          <circle cx="28.2" cy="21.8" r="0.35" fill="white" opacity="0.6" />

          {/* Nose — heart-shaped cat nose */}
          <path d="M23 24.5 Q24 23.5 25 24.5 Q24 26 23 24.5Z" fill="#101820" />

          {/* Tear marks — cheetah signature */}
          <path d="M19 23.5 Q17.5 27 16.5 31" stroke="#101820" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M29 23.5 Q30.5 27 31.5 31" stroke="#101820" strokeWidth="1.6" strokeLinecap="round" fill="none" />

          {/* Smile */}
          <path d="M22 27 Q24 29.5 26 27" stroke="#101820" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Spots on forehead */}
          <circle cx="18" cy="16" r="1" fill="#101820" opacity="0.18" />
          <circle cx="24" cy="14" r="0.8" fill="#101820" opacity="0.15" />
          <circle cx="30" cy="16" r="1" fill="#101820" opacity="0.18" />
        </g>

        {/* Speed lines */}
        <g opacity="0.5">
          <path d="M5 17 L11 19.5" stroke="#ff7336" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M3 24 L10 24" stroke="#ff7336" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 31 L11 28.5" stroke="#ff7336" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Subtle glow behind head */}
        <circle cx="24" cy="22" r="13" fill="#ff7336" opacity="0.06" />
      </svg>
    )
  }

  /* ─── FULL ─── */
  return (
    <svg
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Flash, o guepardo do RevSend"
    >
      {/* ── DEFS ── */}
      <defs>
        {/* Body fur gradient — warm orange */}
        <linearGradient id={id('fur')} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFBE8A" />
          <stop offset="40%" stopColor="#ff7336" />
          <stop offset="100%" stopColor="#E85A1E" />
        </linearGradient>

        {/* Belly — cream */}
        <radialGradient id={id('belly')} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#FFF2EC" />
          <stop offset="100%" stopColor="#FFD8C2" />
        </radialGradient>

        {/* Head top highlight */}
        <radialGradient id={id('headHL')} cx="45%" cy="25%" r="50%">
          <stop offset="0%" stopColor="#FFCFA6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ff7336" stopOpacity="0" />
        </radialGradient>

        {/* Eye iris gradient */}
        <radialGradient id={id('iris')} cx="55%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#2A1A00" />
          <stop offset="100%" stopColor="#101820" />
        </radialGradient>

        {/* Ambient glow behind mascot */}
        <radialGradient id={id('ambientGlow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff7336" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ff7336" stopOpacity="0" />
        </radialGradient>

        {/* Mint glow for celebration */}
        <radialGradient id={id('mintGlow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00D9A5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00D9A5" stopOpacity="0" />
        </radialGradient>

        {/* Drop shadow */}
        <filter id={id('shadow')} x="-15%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#101820" floodOpacity="0.2" />
        </filter>

        {/* Soft inner glow for eyes */}
        <filter id={id('eyeGlow')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Fur texture pattern — tiny stippled dots */}
        <pattern id={id('furTex')} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.4" fill="#101820" opacity="0.06" />
          <circle cx="4" cy="3" r="0.3" fill="#101820" opacity="0.04" />
          <circle cx="2" cy="5" r="0.35" fill="#101820" opacity="0.05" />
        </pattern>

        {/* Spot pattern for cheetah body */}
        <pattern id={id('spots')} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="2.2" fill="#101820" opacity="0.15" />
          <circle cx="15" cy="12" r="1.8" fill="#101820" opacity="0.12" />
          <circle cx="10" cy="18" r="2" fill="#101820" opacity="0.13" />
        </pattern>

        {/* Clip for spots to stay within body */}
        <clipPath id={id('bodyClip')}>
          <ellipse cx="70" cy="100" rx="30" ry="24" />
        </clipPath>

        <clipPath id={id('headClip')}>
          <ellipse cx="70" cy="55" rx="25" ry="23" />
        </clipPath>
      </defs>

      {/* ── AMBIENT GLOW ── */}
      <ellipse cx="70" cy="80" rx="55" ry="60" fill={`url(#${id('ambientGlow')})`} />
      {isCelebrating && <ellipse cx="70" cy="80" rx="60" ry="65" fill={`url(#${id('mintGlow')})`} />}

      {/* ── GROUND SHADOW ── */}
      <ellipse cx="70" cy="148" rx="32" ry="5" fill="#101820" opacity="0.12" />

      {/* ── MAIN GROUP ── */}
      <g
        filter={`url(#${id('shadow')})`}
        style={{ transform: `translateY(${bodyY}px)`, transformOrigin: '70px 80px' }}
      >
        {/* ── TAIL ── */}
        <g style={{ transform: `rotate(${tailWag}deg)`, transformOrigin: '95px 100px' }}>
          <path
            d="M95 102 Q115 92 120 75 Q124 58 118 48 Q115 42 110 44"
            stroke={`url(#${id('fur')})`}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* Tail tip — dark rings */}
          <path d="M113 50 Q110 44 112 42" stroke="#101820" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M116 55 Q113 50 115 47" stroke="#101820" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.4" />
        </g>

        {/* ── BODY ── */}
        <ellipse cx="70" cy="100" rx="30" ry="24" fill={`url(#${id('fur')})`} />
        {/* Fur texture overlay */}
        <ellipse cx="70" cy="100" rx="30" ry="24" fill={`url(#${id('furTex')})`} />
        {/* Spots clipped to body */}
        <g clipPath={`url(#${id('bodyClip')})`}>
          <rect x="40" y="76" width="60" height="48" fill={`url(#${id('spots')})`} />
        </g>
        {/* Belly */}
        <ellipse cx="70" cy="105" rx="19" ry="14" fill={`url(#${id('belly')})`} opacity="0.55" />

        {/* ── LEGS ── */}
        {/* Back legs (behind) */}
        <path d="M80 118 Q82 130 84 140 L78 140 Q77 130 76 120" fill={`url(#${id('fur')})`} />
        <path d="M58 118 Q56 130 54 140 L60 140 Q61 130 62 120" fill={`url(#${id('fur')})`} />
        {/* Back paws */}
        <ellipse cx="81" cy="141" rx="5.5" ry="3" fill="#E85A1E" />
        <ellipse cx="57" cy="141" rx="5.5" ry="3" fill="#E85A1E" />
        {/* Paw pads */}
        <circle cx="79" cy="141" r="1" fill="#C44A14" opacity="0.5" />
        <circle cx="83" cy="141" r="1" fill="#C44A14" opacity="0.5" />
        <circle cx="55" cy="141" r="1" fill="#C44A14" opacity="0.5" />
        <circle cx="59" cy="141" r="1" fill="#C44A14" opacity="0.5" />

        {/* Front legs */}
        <path d="M52 115 Q49 128 47 140 L53 140 Q54 128 56 117" fill={`url(#${id('fur')})`} />
        <path d="M88 115 Q91 128 93 140 L87 140 Q86 128 84 117" fill={`url(#${id('fur')})`} />
        {/* Front paws */}
        <ellipse cx="50" cy="141" rx="5.5" ry="3" fill="#E85A1E" />
        <ellipse cx="90" cy="141" rx="5.5" ry="3" fill="#E85A1E" />
        <circle cx="48" cy="141" r="1" fill="#C44A14" opacity="0.5" />
        <circle cx="52" cy="141" r="1" fill="#C44A14" opacity="0.5" />
        <circle cx="88" cy="141" r="1" fill="#C44A14" opacity="0.5" />
        <circle cx="92" cy="141" r="1" fill="#C44A14" opacity="0.5" />

        {/* ── NECK ── */}
        <path d="M52 85 Q55 72 60 66 L80 66 Q85 72 88 85" fill={`url(#${id('fur')})`} />
        <path d="M55 82 Q58 74 63 68 L77 68 Q82 74 85 82" fill={`url(#${id('furTex')})`} />

        {/* ── HEAD ── */}
        <g style={{ transform: `scaleY(${breathe})`, transformOrigin: '70px 55px' }}>
          <ellipse cx="70" cy="55" rx="25" ry="23" fill={`url(#${id('fur')})`} />
          {/* Fur texture on head */}
          <ellipse cx="70" cy="55" rx="25" ry="23" fill={`url(#${id('furTex')})`} />
          {/* Highlight on top of head */}
          <ellipse cx="70" cy="55" rx="25" ry="23" fill={`url(#${id('headHL')})`} />

          {/* Head spots clipped */}
          <g clipPath={`url(#${id('headClip')})`}>
            <circle cx="52" cy="45" r="2" fill="#101820" opacity="0.14" />
            <circle cx="88" cy="45" r="2" fill="#101820" opacity="0.14" />
            <circle cx="58" cy="38" r="1.5" fill="#101820" opacity="0.12" />
            <circle cx="82" cy="38" r="1.5" fill="#101820" opacity="0.12" />
            <circle cx="70" cy="35" r="1.2" fill="#101820" opacity="0.1" />
            <circle cx="64" cy="40" r="1.8" fill="#101820" opacity="0.11" />
            <circle cx="76" cy="40" r="1.8" fill="#101820" opacity="0.11" />
          </g>

          {/* ── EARS ── */}
          <g style={{ transform: `translateY(${earTwitch}px)`, transformOrigin: '50px 35px' }}>
            <path d="M48 40 L38 20 L55 34Z" fill={`url(#${id('fur')})`} />
            <path d="M49 38 L41 23 L53 35Z" fill="#FFC9B1" />
            <path d="M49 37 L43 26 L52 35Z" fill="#FFB8A0" opacity="0.5" />
          </g>
          <g style={{ transform: `translateY(${-earTwitch * 0.7}px)`, transformOrigin: '90px 35px' }}>
            <path d="M92 40 L102 20 L85 34Z" fill={`url(#${id('fur')})`} />
            <path d="M91 38 L99 23 L87 35Z" fill="#FFC9B1" />
            <path d="M91 37 L97 26 L88 35Z" fill="#FFB8A0" opacity="0.5" />
          </g>

          {/* ── FACE — lighter muzzle ── */}
          <ellipse cx="70" cy="62" rx="15" ry="11" fill="#FFE4D8" opacity="0.45" />
          <ellipse cx="70" cy="64" rx="10" ry="7" fill="#FFF2EC" opacity="0.3" />

          {/* ── EYES ── */}
          <g filter={`url(#${id('eyeGlow')})`}>
            {isThinking ? (
              <>
                {/* Looking up */}
                <ellipse cx="59" cy="51" rx="7" ry="8" fill="white" />
                <ellipse cx="81" cy="51" rx="7" ry="8" fill="white" />
                <ellipse cx="59.5" cy="48" rx="4" ry="4.5" fill={`url(#${id('iris')})`} />
                <ellipse cx="81.5" cy="48" rx="4" ry="4.5" fill={`url(#${id('iris')})`} />
                <circle cx="61" cy="47" r="1.5" fill="white" />
                <circle cx="83" cy="47" r="1.5" fill="white" />
                <circle cx="58" cy="49.5" r="0.7" fill="white" opacity="0.5" />
                <circle cx="80" cy="49.5" r="0.7" fill="white" opacity="0.5" />
              </>
            ) : isCelebrating ? (
              <>
                {/* Happy arches */}
                <path d="M52 53 Q59 44 66 53" stroke="#101820" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M74 53 Q81 44 88 53" stroke="#101820" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Sparkle near eyes */}
                <circle cx="67" cy="48" r="1.5" fill="#FFD93D" opacity="0.8" />
                <circle cx="73" cy="48" r="1.5" fill="#FFD93D" opacity="0.8" />
              </>
            ) : (
              <>
                {/* Normal happy eyes — large anime-style */}
                <ellipse cx="59" cy="52" rx="7" ry="8" fill="white" />
                <ellipse cx="81" cy="52" rx="7" ry="8" fill="white" />
                {/* Iris */}
                <ellipse cx="61" cy="53" rx="4" ry="4.5" fill={`url(#${id('iris')})`} />
                <ellipse cx="83" cy="53" rx="4" ry="4.5" fill={`url(#${id('iris')})`} />
                {/* Pupils */}
                <circle cx="62" cy="53" r="2.2" fill="#000" />
                <circle cx="84" cy="53" r="2.2" fill="#000" />
                {/* Main highlights */}
                <circle cx="63" cy="51" r="1.8" fill="white" />
                <circle cx="85" cy="51" r="1.8" fill="white" />
                {/* Secondary highlights */}
                <circle cx="59.5" cy="55" r="0.8" fill="white" opacity="0.5" />
                <circle cx="81.5" cy="55" r="0.8" fill="white" opacity="0.5" />
                {/* Bottom lid line for expression */}
                <path d="M53 56 Q59 58 65 56" stroke="#E85A1E" strokeWidth="0.8" fill="none" opacity="0.4" />
                <path d="M75 56 Q81 58 87 56" stroke="#E85A1E" strokeWidth="0.8" fill="none" opacity="0.4" />
              </>
            )}
          </g>

          {/* ── NOSE — detailed cat nose ── */}
          <path d="M67 62 Q70 60 73 62 Q70 65 67 62Z" fill="#2A1A00" />
          <ellipse cx="70" cy="62.5" rx="2.5" ry="1.5" fill="#101820" />
          {/* Nose highlight */}
          <ellipse cx="69.5" cy="61.8" rx="1" ry="0.6" fill="white" opacity="0.25" />

          {/* ── TEAR MARKS — cheetah's iconic feature ── */}
          <path
            d="M56 58 Q52 66 49 78"
            stroke="#101820"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M84 58 Q88 66 91 78"
            stroke="#101820"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Tear mark inner highlight */}
          <path d="M56.5 59 Q53 66 50 76" stroke="#2A1A00" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
          <path d="M83.5 59 Q87 66 90 76" stroke="#2A1A00" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />

          {/* ── MOUTH ── */}
          {isCelebrating ? (
            <>
              <path d="M62 68 Q70 78 78 68" stroke="#101820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Open mouth fill */}
              <path d="M63 68 Q70 76 77 68" fill="#C44A14" opacity="0.3" />
              {/* Tongue */}
              <ellipse cx="70" cy="72" rx="4" ry="3" fill="#FF8080" opacity="0.6" />
            </>
          ) : (
            <>
              <path d="M64 67 Q70 73 76 67" stroke="#101820" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Subtle mouth line */}
              <path d="M70 65 L70 67" stroke="#101820" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* ── WHISKERS ── */}
          <g opacity="0.25">
            <path d="M54 64 L32 59" stroke="#101820" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M54 67 L32 67" stroke="#101820" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M54 70 L34 75" stroke="#101820" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M86 64 L108 59" stroke="#101820" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M86 67 L108 67" stroke="#101820" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M86 70 L106 75" stroke="#101820" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* ── BLUSH (celebrating) ── */}
          {isCelebrating && (
            <>
              <ellipse cx="46" cy="62" rx="5" ry="3" fill="#ff7336" opacity="0.3" />
              <ellipse cx="94" cy="62" rx="5" ry="3" fill="#ff7336" opacity="0.3" />
            </>
          )}
        </g>

        {/* ── LIGHTNING BOLT BADGE ── on chest */}
        <g>
          <circle cx="70" cy="90" r="8" fill="#FFD93D" opacity="0.15" />
          <path
            d="M68 84 L65 89 L69 89 L67 96 L75 88 L71 88 L73 84Z"
            fill="#FFD93D"
          />
          <path
            d="M68.5 85 L66 89 L69.5 89 L67.5 95 L74 88.5 L71 88.5 L72.5 85Z"
            fill="#FFED85"
            opacity="0.5"
          />
        </g>

        {/* ── SPEED LINES (animated) ── */}
        {isAnimated && (
          <g>
            <line x1="5" y1="45" x2="22" y2="48" stroke="#ff7336" strokeWidth="3" strokeLinecap="round" opacity="0.5" strokeDasharray="4 6">
              <animate attributeName="x1" values="5;0;5" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="2" y1="55" x2="20" y2="55" stroke="#ff7336" strokeWidth="4" strokeLinecap="round" opacity="0.7" strokeDasharray="6 4">
              <animate attributeName="x1" values="2;-3;2" dur="1s" repeatCount="indefinite" />
            </line>
            <line x1="5" y1="65" x2="22" y2="62" stroke="#ff7336" strokeWidth="3" strokeLinecap="round" opacity="0.5" strokeDasharray="4 6">
              <animate attributeName="x1" values="5;0;5" dur="1.4s" repeatCount="indefinite" />
            </line>
          </g>
        )}

        {/* ── CELEBRATION EFFECTS ── */}
        {isCelebrating && (
          <>
            {/* Confetti stars */}
            <g>
              <path d="M20 25 L22 30 L27 30 L23 33 L25 38 L20 35 L15 38 L17 33 L13 30 L18 30Z" fill="#FFD93D" opacity="0.85">
                {isAnimated && <animateTransform attributeName="transform" type="rotate" values="0 20 31;360 20 31" dur="3s" repeatCount="indefinite" />}
              </path>
              <path d="M115 22 L116 25 L119 25 L117 27 L118 30 L115 28 L112 30 L113 27 L111 25 L114 25Z" fill="#00D9A5" opacity="0.7">
                {isAnimated && <animateTransform attributeName="transform" type="rotate" values="0 115 26;-360 115 26" dur="4s" repeatCount="indefinite" />}
              </path>
              <path d="M125 60 L126 63 L129 63 L127 65 L128 68 L125 66 L122 68 L123 65 L121 63 L124 63Z" fill="#FFD93D" opacity="0.6" />
              <circle cx="15" cy="55" r="3" fill="#00D9A5" opacity="0.4" />
              <circle cx="128" cy="45" r="2" fill="#ff7336" opacity="0.5" />
            </g>
            {/* Sparkle particles */}
            <g>
              <circle cx="30" cy="40" r="1.5" fill="white" opacity="0.7">
                {isAnimated && <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite" />}
              </circle>
              <circle cx="110" cy="35" r="1.5" fill="white" opacity="0.5">
                {isAnimated && <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />}
              </circle>
              <circle cx="25" cy="70" r="1" fill="#FFD93D" opacity="0.6">
                {isAnimated && <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />}
              </circle>
            </g>
          </>
        )}

        {/* ── THINKING BUBBLE ── */}
        {isThinking && (
          <g>
            <circle cx="108" cy="28" r="10" fill="white" opacity="0.92">
              {isAnimated && <animate attributeName="r" values="10;11;10" dur="2s" repeatCount="indefinite" />}
            </circle>
            <circle cx="99" cy="40" r="6" fill="white" opacity="0.75" />
            <circle cx="93" cy="48" r="3.5" fill="white" opacity="0.55" />
            {/* Question mark or dots inside bubble */}
            <circle cx="104" cy="27" r="1.5" fill="#101820" opacity="0.4" />
            <circle cx="108" cy="27" r="1.5" fill="#101820" opacity="0.4" />
            <circle cx="112" cy="27" r="1.5" fill="#101820" opacity="0.4" />
          </g>
        )}
      </g>

      {/* CSS animations for the SVG via style tag */}
      {isAnimated && (
        <style>{`
          @keyframes cheetah-breathe-${uid} {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.02); }
          }
        `}</style>
      )}
    </svg>
  )
}

export function RevSendMascotMini({ className = 'w-8 h-8' }: { className?: string }) {
  return <RevSendMascot className={className} variant="mini" />
}

export function RevSendMascotAnimated({ className = 'w-32 h-32', mood = 'happy' as const }) {
  return <RevSendMascot className={className} variant="animated" mood={mood} />
}

export function RevSendMascotCelebrating({ className = 'w-32 h-32' }) {
  return <RevSendMascot className={className} variant="animated" mood="celebrating" />
}
