'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Shield, ArrowLeft } from 'lucide-react'

interface TwoFactorVerifyProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export function TwoFactorVerify({ email, onSuccess, onBack }: TwoFactorVerifyProps) {
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token || token.length !== 6) {
      toast.error('Digite um código de 6 dígitos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      })

      if (!response.ok) {
        throw new Error('Invalid token')
      }

      toast.success('Código verificado!')
      onSuccess()
    } catch (error) {
      toast.error('Código inválido. Tente novamente.')
      setToken('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Autenticação de Dois Fatores
        </CardTitle>
        <CardDescription>Digite o código do seu aplicativo autenticador</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Código de Verificação</Label>
            <Input
              id="token"
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Insira o código de 6 dígitos do Google Authenticator ou Authy
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading || token.length !== 6} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar Código
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
