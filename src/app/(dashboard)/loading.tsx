export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral-500 border-t-transparent" />
        <p className="text-sm text-navy-300">Carregando...</p>
      </div>
    </div>
  )
}
