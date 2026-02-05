'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { RevSendMascot } from '@/components/logo/RevSendMascot'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resetUrl, setResetUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Digite seu email')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar recuperação')
      }

      setSubmitted(true)

      // In development, show the reset URL
      if (process.env.NODE_ENV === 'development' && data.resetUrl) {
        setResetUrl(data.resetUrl)
      }

      toast.success('Email de recuperação enviado!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar recuperação')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-navy via-navy to-orange/10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Email Enviado!</CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Email enviado para:</p>
              </div>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>

            {resetUrl && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 space-y-2">
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  DESENVOLVIMENTO - Link de reset:
                </p>
                <a
                  href={resetUrl}
                  className="text-xs text-yellow-600 dark:text-yellow-400 underline break-all hover:text-yellow-700"
                >
                  {resetUrl}
                </a>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Não recebeu o email?</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>Verifique sua pasta de spam</li>
                <li>Aguarde alguns minutos</li>
                <li>Tente solicitar novamente</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
                Solicitar Novamente
              </Button>
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-navy via-navy to-orange/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <RevSendMascot className="w-20 h-24" variant="static" mood="thinking" />
          </div>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email e enviaremos um link para redefinir sua senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Link de Recuperação
            </Button>

            <Link href="/login" className="w-full block">
              <Button type="button" variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
