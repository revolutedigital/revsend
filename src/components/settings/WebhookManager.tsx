"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  isActive: boolean;
  lastError: string | null;
  lastCalledAt: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  "campaign.started": "Campanha Iniciada",
  "campaign.completed": "Campanha Concluída",
  "campaign.paused": "Campanha Pausada",
  "message.sent": "Mensagem Enviada",
  "message.failed": "Mensagem Falhou",
  "reply.received": "Resposta Recebida",
};

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [generateSecret, setGenerateSecret] = useState(true);
  const [showSecret, setShowSecret] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch("/api/webhooks");
      const data = await response.json();
      if (data.webhooks) {
        setWebhooks(data.webhooks);
        setAvailableEvents(data.availableEvents || []);
      }
    } catch (error) {
      console.error("Erro ao buscar webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const resetForm = () => {
    setName("");
    setUrl("");
    setSelectedEvents([]);
    setGenerateSecret(true);
    setEditingWebhook(null);
  };

  const openEditDialog = (webhook: WebhookData) => {
    setEditingWebhook(webhook);
    setName(webhook.name);
    setUrl(webhook.url);
    setSelectedEvents(webhook.events);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;

    setSaving(true);
    try {
      const payload = editingWebhook
        ? { name, url, events: selectedEvents }
        : { name, url, events: selectedEvents, generateSecret };

      const response = await fetch(
        editingWebhook ? `/api/webhooks/${editingWebhook.id}` : "/api/webhooks",
        {
          method: editingWebhook ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        fetchWebhooks();
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao salvar webhook:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este webhook?")) return;

    try {
      const response = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (response.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir webhook:", error);
    }
  };

  const handleToggleActive = async (webhook: WebhookData) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });
      if (response.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    setTestResult(null);
    try {
      const response = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = await response.json();
      setTestResult({ id, success: data.success });
      fetchWebhooks(); // Atualizar lastCalledAt e lastError
    } catch (error) {
      setTestResult({ id, success: false });
    } finally {
      setTesting(null);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {webhooks.length}/10 webhooks configurados
        </p>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={webhooks.length >= 10}>
              <Plus className="h-4 w-4" />
              Adicionar Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="webhookName">Nome</Label>
                <Input
                  id="webhookName"
                  placeholder="Ex: Integração CRM"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://seu-sistema.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((event) => (
                    <label
                      key={event}
                      className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                        selectedEvents.includes(event)
                          ? "bg-orange/10 border-orange"
                          : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          selectedEvents.includes(event)
                            ? "bg-orange border-orange text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedEvents.includes(event) && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                      </div>
                      <span className="text-sm">{EVENT_LABELS[event] || event}</span>
                    </label>
                  ))}
                </div>
              </div>

              {!editingWebhook && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateSecret}
                    onChange={(e) => setGenerateSecret(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Gerar chave secreta (HMAC)</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="orange"
                  onClick={handleSubmit}
                  disabled={saving || !name.trim() || !url.trim() || selectedEvents.length === 0}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : editingWebhook ? (
                    "Salvar Alterações"
                  ) : (
                    "Criar Webhook"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Webhook className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>Nenhum webhook configurado</p>
          <p className="text-sm">Configure webhooks para integrar com seus sistemas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-orange" />
                    <span className="font-medium">{webhook.name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        webhook.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {webhook.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {webhook.url}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-0.5 bg-muted text-xs rounded"
                      >
                        {EVENT_LABELS[event] || event}
                      </span>
                    ))}
                  </div>
                  {webhook.secret && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Secret:</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {showSecret === webhook.id
                          ? webhook.secret
                          : "••••••••••••••••"}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          setShowSecret(showSecret === webhook.id ? null : webhook.id)
                        }
                      >
                        {showSecret === webhook.id ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(webhook.secret!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {webhook.lastError && (
                    <p className="text-xs text-red-500 mt-1">
                      Último erro: {webhook.lastError}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testing === webhook.id}
                    title="Testar webhook"
                  >
                    {testing === webhook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : testResult?.id === webhook.id ? (
                      testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(webhook)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleActive(webhook)}
                  >
                    {webhook.isActive ? (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
