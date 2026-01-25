"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppManager } from "@/components/settings/WhatsAppManager";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Smartphone, Key, User, Loader2, CheckCircle2, Webhook, Palette, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [savingApi, setSavingApi] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [apiSaved, setApiSaved] = useState(false);
  const [apiError, setApiError] = useState("");

  // Verificar se ja tem API key configurada
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasAnthropicKey) {
          setHasApiKey(true);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setSavingApi(true);
    setApiError("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anthropicApiKey: apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar");
      }

      setApiSaved(true);
      setHasApiKey(true);
      setApiKey(""); // Limpa o campo apos salvar
      setTimeout(() => setApiSaved(false), 3000);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSavingApi(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    // TODO: Implementar atualização de perfil
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavingProfile(false);
  };

  return (
    <>
      <Header
        title="Configurações"
        description="Configure sua conta e WhatsApps"
      />

      <div className="p-6 space-y-6">
        {/* WhatsApp Numbers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-orange" />
              Números de WhatsApp
            </CardTitle>
            <CardDescription>
              Conecte até 4 números de WhatsApp para usar nas campanhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WhatsAppManager />
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange" />
              Configurações de IA
            </CardTitle>
            <CardDescription>
              Configure a API do Claude para geração de variações de mensagens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasApiKey && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  API key configurada. Digite uma nova chave para substituir.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave da API Anthropic</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={hasApiKey ? "••••••••••••••••" : "sk-ant-..."}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setApiError("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha sua chave em{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>

            {apiError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{apiError}</span>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleSaveApiKey}
              disabled={savingApi || !apiKey.trim()}
            >
              {savingApi ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : apiSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Salvo!
                </>
              ) : (
                "Salvar API Key"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-orange" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Configure webhooks para integrar com seus sistemas externos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookManager />
          </CardContent>
        </Card>

        {/* Aparencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#FF6B35]" />
              Aparencia
            </CardTitle>
            <CardDescription>
              Personalize a aparencia do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tema</p>
                <p className="text-sm text-muted-foreground">
                  Escolha entre tema claro, escuro ou automatico
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#FF6B35]" />
              Conta
            </CardTitle>
            <CardDescription>
              Gerencie suas informacoes pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email nao pode ser alterado
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSaveProfile}
              isLoading={savingProfile}
              loadingText="Salvando..."
            >
              Atualizar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
