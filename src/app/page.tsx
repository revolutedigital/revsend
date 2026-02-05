import { RevSendWordmark } from "@/components/logo/RevSendLogo";
import { RevSendMascotAnimated } from "@/components/logo/RevSendMascot";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-navy relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-coral/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-mint/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-10 text-center">
          {/* Logo with animation */}
          <div className="animate-in-up">
            <RevSendMascotAnimated className="w-40 h-44 mx-auto" />
          </div>

          {/* Typography */}
          <div className="space-y-4 animate-in-up animate-in-up-delay-1">
            <h1 className="text-5xl font-display font-bold tracking-tight">
              <RevSendWordmark className="text-5xl justify-center" />
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Prospecção ativa via WhatsApp de forma{' '}
              <span className="text-mint font-medium">inteligente</span> e{' '}
              <span className="text-coral font-medium">segura</span>
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-4 pt-4 animate-in-up animate-in-up-delay-2">
            <Link
              href="/login"
              className="block w-full text-center bg-[#ff7336] hover:bg-[#E85520] text-white font-semibold py-3.5 px-6 rounded-lg transition-all hover:shadow-[0_0_25px_rgba(255,115,54,0.4)] hover:-translate-y-0.5"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="block w-full text-center border-2 border-[#ff7336] text-[#ff7336] hover:bg-[#ff7336] hover:text-white font-semibold py-3.5 px-6 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,115,54,0.25)]"
            >
              Criar Conta
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="pt-8 animate-in-up animate-in-up-delay-3">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-mint rounded-full animate-pulse" />
                <span>Anti-bloqueio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-coral rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <span>Disparo em massa</span>
              </div>
            </div>
            <p className="text-muted-foreground/60 text-xs mt-4">
              Rotação inteligente de números e mensagens
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-px divider-gradient" />
      </div>
    </main>
  );
}
