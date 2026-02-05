'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Algo deu errado</h2>
        <p className="text-sm text-navy-300">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <Button onClick={reset} variant="outline" size="sm">
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
