interface RevSendLogoProps {
  className?: string;
}

// Logo Principal RevSend 2026
// Conceito: Seta de envio dinamica - representa velocidade e disparo em massa
export function RevSendLogo({ className = "w-24 h-24" }: RevSendLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradiente coral vibrante */}
        <linearGradient id="coralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8F5C" />
          <stop offset="50%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#E85520" />
        </linearGradient>

        {/* Gradiente mint para destaque */}
        <linearGradient id="mintGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B388" />
          <stop offset="100%" stopColor="#00D9A5" />
        </linearGradient>

        {/* Efeito de brilho */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Sombra */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0A1628" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Circulo de fundo navy com borda coral */}
      <circle cx="60" cy="60" r="56" fill="#0F1E32" filter="url(#shadow)" />
      <circle cx="60" cy="60" r="54" stroke="#FF6B35" strokeWidth="3" fill="none" />

      {/* Seta principal - formato bold e visivel */}
      <path
        d="M25 60 L50 35 L50 48 L95 48 L95 72 L50 72 L50 85 L25 60Z"
        fill="url(#coralGradient)"
        filter="url(#glow)"
      />

      {/* Rastros de velocidade */}
      <path d="M12 50 L30 50" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <path d="M8 60 L25 60" stroke="#FF6B35" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      <path d="M12 70 L30 70" stroke="#FF6B35" strokeWidth="4" strokeLinecap="round" opacity="0.7" />

      {/* Indicador de destino - mint */}
      <circle cx="88" cy="60" r="8" fill="url(#mintGradient)" />
      <circle cx="88" cy="60" r="4" fill="white" opacity="0.9" />

      {/* Linhas internas representando mensagens */}
      <rect x="55" y="54" width="25" height="4" rx="2" fill="#0A1628" opacity="0.4" />
      <rect x="55" y="62" width="18" height="4" rx="2" fill="#0A1628" opacity="0.3" />
    </svg>
  );
}

// Logo compacto para sidebar e favicon
export function RevSendLogoCompact({ className = "w-10 h-10" }: RevSendLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="compactCoral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9A6C" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
        <linearGradient id="compactMint" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D9A5" />
          <stop offset="100%" stopColor="#4FFFCB" />
        </linearGradient>
      </defs>

      {/* Fundo laranja solido - alta visibilidade */}
      <circle cx="20" cy="20" r="18" fill="#FF6B35" />

      {/* Ring interno branco para destaque */}
      <circle cx="20" cy="20" r="15" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />

      {/* Seta de envio - branca para contraste maximo */}
      <path
        d="M10 20 L17 13 L17 17 L28 17 L28 23 L17 23 L17 27 L10 20Z"
        fill="white"
      />

      {/* Linhas de velocidade - brancas */}
      <path d="M6 16 L11 16" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M4 20 L9 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <path d="M6 24 L11 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

      {/* Ponto de destino mint */}
      <circle cx="30" cy="20" r="3.5" fill="#00D9A5" />
      <circle cx="30" cy="20" r="1.5" fill="white" />
    </svg>
  );
}

// Logo horizontal com texto
export function RevSendLogoFull({ className = "h-10" }: RevSendLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <RevSendLogoCompact className="w-10 h-10" />
      <span className="font-display text-2xl font-bold tracking-tight">
        <span className="text-white">Rev</span>
        <span className="text-[#FF6B35]">Send</span>
      </span>
    </div>
  );
}

// Wordmark apenas (sem icone)
export function RevSendWordmark({ className = "" }: RevSendLogoProps) {
  return (
    <span className={`font-display font-bold tracking-tight inline-flex ${className}`}>
      <span className="text-white">Rev</span>
      <span className="text-[#FF6B35]">Send</span>
    </span>
  );
}

// Logo animado para loading states
export function RevSendLogoAnimated({ className = "w-16 h-16" }: RevSendLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} animate-pulse`}
    >
      <defs>
        <linearGradient id="animNavy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1628" />
          <stop offset="100%" stopColor="#1A2D4A" />
        </linearGradient>
        <linearGradient id="animCoral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8F5C" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
        <linearGradient id="animMint" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B388" />
          <stop offset="100%" stopColor="#00D9A5" />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="60" cy="60" r="56" fill="url(#animNavy)" />

      {/* Rastros animados */}
      <g>
        <path d="M22 60 L42 60" stroke="url(#animCoral)" strokeWidth="4" strokeLinecap="round" />
        <path d="M25 50 L40 50" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M25 70 L40 70" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* Foguete */}
      <path
        d="M48 40 C48 35, 55 30, 65 30 L85 30 C95 30, 100 40, 100 50 L100 70 C100 80, 95 90, 85 90 L65 90 C55 90, 48 85, 48 80 L48 40Z"
        fill="url(#animCoral)"
      />

      {/* Propulsao pulsante */}
      <ellipse cx="48" cy="60" rx="8" ry="18" fill="url(#animMint)" />
      <ellipse cx="45" cy="60" rx="5" ry="12" fill="#00D9A5" />
    </svg>
  );
}
