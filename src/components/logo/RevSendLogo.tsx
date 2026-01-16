interface RevSendLogoProps {
  className?: string;
}

// Logo Principal RevSend 2026
// Conceito: Foguete de mensagem - representa velocidade, disparo em massa e comunicação
// O foguete é formado pela fusão de um ícone de chat/mensagem com propulsão
export function RevSendLogo({ className = "w-24 h-24" }: RevSendLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Gradiente principal navy */}
        <linearGradient id="navyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1628" />
          <stop offset="100%" stopColor="#1A2D4A" />
        </linearGradient>

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
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Sombra suave */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0A1628" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Circulo de fundo navy */}
      <circle cx="60" cy="60" r="56" fill="url(#navyGradient)" filter="url(#shadow)" />

      {/* Anel sutil externo */}
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke="#FF6B35"
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />

      {/* Rastros de velocidade (3 linhas que representam movimento) */}
      <path
        d="M25 70 L40 70"
        stroke="url(#coralGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M22 60 L42 60"
        stroke="url(#coralGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="1"
      />
      <path
        d="M25 50 L40 50"
        stroke="url(#coralGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Corpo do foguete/mensagem - formato de balao de chat aerodinamico */}
      <path
        d="M48 40
           C48 35, 55 30, 65 30
           L85 30
           C95 30, 100 40, 100 50
           L100 70
           C100 80, 95 90, 85 90
           L65 90
           C55 90, 48 85, 48 80
           L48 40Z"
        fill="url(#coralGradient)"
        filter="url(#glow)"
      />

      {/* Ponta do foguete (nose cone) */}
      <path
        d="M85 30 L100 45 L100 50 C100 40, 95 30, 85 30Z"
        fill="#E85520"
      />

      {/* Detalhe interno - 3 linhas representando texto/mensagens */}
      <rect x="55" y="45" width="35" height="4" rx="2" fill="#0A1628" opacity="0.3" />
      <rect x="55" y="55" width="28" height="4" rx="2" fill="#0A1628" opacity="0.25" />
      <rect x="55" y="65" width="20" height="4" rx="2" fill="#0A1628" opacity="0.2" />

      {/* Propulsao do foguete - chamas mint */}
      <ellipse cx="48" cy="60" rx="8" ry="18" fill="url(#mintGradient)" opacity="0.9" />
      <ellipse cx="45" cy="60" rx="5" ry="12" fill="#00D9A5" />
      <ellipse cx="43" cy="60" rx="3" ry="8" fill="white" opacity="0.8" />

      {/* Particulas de velocidade */}
      <circle cx="30" cy="55" r="2" fill="#00D9A5" opacity="0.6" />
      <circle cx="32" cy="65" r="1.5" fill="#00D9A5" opacity="0.5" />
      <circle cx="28" cy="45" r="1.5" fill="#FF6B35" opacity="0.4" />
      <circle cx="35" cy="75" r="1" fill="#FF6B35" opacity="0.3" />
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
        <linearGradient id="compactNavy" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1628" />
          <stop offset="100%" stopColor="#1A2D4A" />
        </linearGradient>
        <linearGradient id="compactCoral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8F5C" />
          <stop offset="100%" stopColor="#FF6B35" />
        </linearGradient>
        <linearGradient id="compactMint" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B388" />
          <stop offset="100%" stopColor="#00D9A5" />
        </linearGradient>
      </defs>

      {/* Base circular */}
      <circle cx="20" cy="20" r="18" fill="url(#compactNavy)" />

      {/* Rastros de velocidade simplificados */}
      <path
        d="M6 20 L12 20"
        stroke="url(#compactCoral)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 16 L11 16"
        stroke="#FF6B35"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M8 24 L11 24"
        stroke="#FF6B35"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Foguete/mensagem compacto */}
      <path
        d="M14 12 L14 28 L18 28 C22 28, 26 26, 30 22 L32 20 L30 18 C26 14, 22 12, 18 12 L14 12Z"
        fill="url(#compactCoral)"
      />

      {/* Linhas de texto */}
      <rect x="17" y="16" width="8" height="2" rx="1" fill="#0A1628" opacity="0.3" />
      <rect x="17" y="20" width="6" height="2" rx="1" fill="#0A1628" opacity="0.25" />

      {/* Propulsao mint */}
      <ellipse cx="14" cy="20" rx="3" ry="6" fill="url(#compactMint)" />
      <ellipse cx="13" cy="20" rx="2" ry="4" fill="#00D9A5" />
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
