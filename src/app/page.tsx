import { RevSendLogo } from "@/components/logo/RevSendLogo";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-navy flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <RevSendLogo className="w-32 h-32 mx-auto" />

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Rev<span className="text-orange">Send</span>
          </h1>
          <p className="text-gray-400">
            Prospecção ativa via WhatsApp de forma inteligente e segura
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Link
            href="/login"
            className="block w-full bg-orange hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="block w-full bg-transparent border-2 border-orange text-orange hover:bg-orange hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Criar Conta
          </Link>
        </div>

        <p className="text-gray-500 text-sm pt-8">
          Envie mensagens em massa sem risco de bloqueio
        </p>
      </div>
    </main>
  );
}
