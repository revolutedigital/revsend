interface RevSendLogoProps {
  className?: string;
}

// Logo principal - Conceito: Ondas de propagação formando movimento
export function RevSendLogo({ className = "w-24 h-24" }: RevSendLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fundo com gradiente sutil */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1628" />
          <stop offset="100%" stopColor="#0F1E32" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#FF8F5C" />
        </linearGradient>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#FF6B35" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Base circular */}
      <circle cx="60" cy="60" r="56" fill="url(#bgGradient)" />

      {/* Ondas de propagação - representam mensagens sendo enviadas */}
      <path
        d="M35 60C35 46.2 46.2 35 60 35"
        stroke="url(#waveGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M28 60C28 42.3 42.3 28 60 28"
        stroke="url(#waveGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M21 60C21 38.5 38.5 21 60 21"
        stroke="url(#waveGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
      />

      {/* Seta dinâmica - representa envio/disparo */}
      <path
        d="M45 75L60 45L75 60L60 55L55 70L45 75Z"
        fill="url(#accentGradient)"
      />

      {/* Ponto de origem - representa a fonte */}
      <circle cx="60" cy="60" r="8" fill="#FF6B35" />
      <circle cx="60" cy="60" r="4" fill="#0A1628" />

      {/* Destaque de ação - pequeno brilho */}
      <circle cx="72" cy="48" r="3" fill="#00D9A5" opacity="0.9" />

      {/* Anel externo sutil */}
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="#FF6B35"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
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
        <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#FF8F5C" />
        </linearGradient>
      </defs>

      {/* Base */}
      <circle cx="20" cy="20" r="18" fill="#0A1628" />

      {/* Onda única */}
      <path
        d="M12 20C12 15.6 15.6 12 20 12"
        stroke="#FF6B35"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* Seta simplificada */}
      <path
        d="M15 26L20 14L28 22L20 19L17 24L15 26Z"
        fill="url(#compactGradient)"
      />

      {/* Centro */}
      <circle cx="20" cy="20" r="3" fill="#FF6B35" />

      {/* Destaque */}
      <circle cx="26" cy="15" r="2" fill="#00D9A5" />
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
        <span className="text-coral">Send</span>
      </span>
    </div>
  );
}

// Wordmark apenas (sem ícone)
export function RevSendWordmark({ className = "" }: RevSendLogoProps) {
  return (
    <span className={`font-display font-bold tracking-tight inline-flex ${className}`}>
      <span className="text-white">Rev</span>
      <span className="text-coral">Send</span>
    </span>
  );
}
