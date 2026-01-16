"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppManager } from "@/components/settings/WhatsAppManager";
import { WebhookManager } from "@/components/settings/WebhookManager";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Smartphone, Key, User, Loader2, CheckCircle2, Webhook, Palette } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState(session?.user?.name || "");
  const [savingApi, setSavingApi] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [apiSaved, setApiSaved] = useState(false);

  const handleSaveApiKey = async () => {
    setSavingApi(true);
    // Em produção, salvar no banco de dados
    // Por enquanto, apenas simula o salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSavingApi(false);
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 3000);
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
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave da API Anthropic</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
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
                "Salvar"
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
