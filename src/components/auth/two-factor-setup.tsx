'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Shield, Copy, Check } from 'lucide-react'
import Image from 'next/image'

interface TwoFactorSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TwoFactorSetup({ open, onOpenChange, onSuccess }: TwoFactorSetupProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'init' | 'scan' | 'verify'>('init')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [manualEntryKey, setManualEntryKey] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSetup = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to setup 2FA')
      }

      const data = await response.json()

      setQrCodeUrl(data.qrCodeUrl)
      setManualEntryKey(data.manualEntryKey)
      setSecret(data.secret)
      setStep('scan')
    } catch (error) {
      toast.error('Falha ao configurar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      toast.error('Digite um código de 6 dígitos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, secret }),
      })

      if (!response.ok) {
        throw new Error('Invalid token')
      }

      toast.success('2FA ativado com sucesso!')
      setStep('init')
      setToken('')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error('Código inválido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(manualEntryKey)
    setCopied(true)
    toast.success('Chave copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Configurar Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription>
            Adicione uma camada extra de segurança à sua conta
          </DialogDescription>
        </DialogHeader>

        {step === 'init' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Como funciona?</h4>
              <p className="text-sm text-muted-foreground">
                O 2FA adiciona uma segunda camada de proteção à sua conta. Após ativar, você
                precisará de um código do seu aplicativo autenticador (como Google Authenticator
                ou Authy) além da senha para fazer login.
              </p>
            </div>

            <Button onClick={handleSetup} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Começar Configuração
            </Button>
          </div>
        )}

        {step === 'scan' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>1. Escaneie o QR Code</Label>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                {qrCodeUrl && (
                  <Image src={qrCodeUrl} alt="QR Code" width={200} height={200} />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ou insira a chave manualmente:</Label>
              <div className="flex gap-2">
                <Input value={manualEntryKey} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              Continuar para Verificação
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">2. Digite o código do autenticador</Label>
              <Input
                id="token"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Digite o código de 6 dígitos do seu aplicativo autenticador
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('scan')} className="w-full">
                Voltar
              </Button>
              <Button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ativar 2FA
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
