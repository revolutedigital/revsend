"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/campaigns/MediaUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Users,
  MessageSquare,
  Clock,
  Smartphone,
  Send,
  Sparkles,
  Calendar,
  Image,
  FileAudio,
  Video,
  FileText,
  Plus,
  Loader2,
  Check,
  Circle,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string | null;
  content: string;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
}

interface MessageWithMedia {
  content: string;
  media?: {
    url: string;
    type: "image" | "audio" | "video";
    name: string;
  } | null;
}

interface ContactList {
  id: string;
  name: string;
  totalContacts: number;
}

interface WhatsAppNumber {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
}

const steps = [
  { id: 1, title: "Lista", icon: Users },
  { id: 2, title: "Mensagens", icon: MessageSquare },
  { id: 3, title: "Intervalo", icon: Clock },
  { id: 4, title: "WhatsApps", icon: Smartphone },
  { id: 5, title: "Revisar", icon: Send },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedWhatsAppIds, setSelectedWhatsAppIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<MessageWithMedia[]>([{ content: "", media: null }]);
  const [minInterval, setMinInterval] = useState(30);
  const [maxInterval, setMaxInterval] = useState(90);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [whatsapps, setWhatsapps] = useState<WhatsAppNumber[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingWhatsapps, setLoadingWhatsapps] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Carregar templates
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch(console.error);

    // Carregar listas
    fetch("/api/lists")
      .then((res) => res.json())
      .then((data) => {
        if (data.lists) {
          setLists(data.lists);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingLists(false));

    // Carregar WhatsApps
    fetch("/api/whatsapp")
      .then((res) => res.json())
      .then((data) => {
        if (data.numbers) {
          setWhatsapps(data.numbers);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingWhatsapps(false));
  }, []);

  const selectedList = lists.find((l) => l.id === selectedListId);
  const selectedWhatsApps = whatsapps.filter((w) => selectedWhatsAppIds.includes(w.id));

  const toggleWhatsApp = (id: string) => {
    setSelectedWhatsAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const addMessage = () => {
    if (messages.length < 10) {
      setMessages([...messages, { content: "", media: null }]);
    }
  };

  const addFromTemplate = (template: Template) => {
    if (messages.length >= 10) return;

    const newMessage: MessageWithMedia = {
      content: template.content,
      media: template.mediaType && template.mediaUrl && template.mediaName
        ? {
            type: template.mediaType as "image" | "audio" | "video",
            url: template.mediaUrl,
            name: template.mediaName,
          }
        : null,
    };

    if (messages.length === 1 && !messages[0].content.trim() && !messages[0].media) {
      setMessages([newMessage]);
    } else {
      setMessages([...messages, newMessage]);
    }

    fetch(`/api/templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timesUsed: (template as Template & { timesUsed?: number }).timesUsed ?? 0 + 1 }),
    }).catch(console.error);

    setTemplateDialogOpen(false);
  };

  const updateMessageContent = (index: number, content: string) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], content };
    setMessages(newMessages);
  };

  const updateMessageMedia = (
    index: number,
    media: { url: string; type: "image" | "audio" | "video"; name: string } | null
  ) => {
    const newMessages = [...messages];
    newMessages[index] = { ...newMessages[index], media };
    setMessages(newMessages);
  };

  const removeMessage = (index: number) => {
    if (messages.length > 1) {
      setMessages(messages.filter((_, i) => i !== index));
    }
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "audio":
        return <FileAudio className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const canCreate = () => {
    return (
      campaignName.trim() &&
      selectedListId &&
      messages.some((m) => m.content.trim()) &&
      selectedWhatsAppIds.length > 0
    );
  };

  const handleCreateCampaign = async () => {
    if (!canCreate()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          listId: selectedListId,
          messages: messages.filter((m) => m.content.trim()),
          minIntervalSeconds: minInterval,
          maxIntervalSeconds: maxInterval,
          whatsappIds: selectedWhatsAppIds,
          scheduledAt: scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });

      if (response.ok) {
        router.push("/campaigns");
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao criar campanha");
      }
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      alert("Erro ao criar campanha");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Header
        title="Nova Campanha"
        description="Configure sua campanha de disparo"
      />

      <div className="p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
                    currentStep === step.id
                      ? "bg-orange text-white"
                      : currentStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                  <span className="font-medium hidden sm:inline">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="max-w-3xl mx-auto">
          {/* Step 1: Lista */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>Selecione a Lista de Contatos</CardTitle>
                <CardDescription>
                  Escolha a lista de contatos para esta campanha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Nome da Campanha</Label>
                  <Input
                    id="campaignName"
                    placeholder="Ex: Prospecção Janeiro 2026"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lista de Contatos</Label>
                  {loadingLists ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : lists.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma lista disponível</p>
                      <p className="text-sm">
                        Importe uma lista primeiro em &quot;Listas de Contatos&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lists.map((list) => (
                        <div
                          key={list.id}
                          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedListId === list.id
                              ? "border-orange bg-orange/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedListId(list.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-orange/10 rounded-lg flex items-center justify-center">
                              <Users className="h-5 w-5 text-orange" />
                            </div>
                            <div>
                              <p className="font-medium">{list.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {list.totalContacts} contatos
                              </p>
                            </div>
                          </div>
                          {selectedListId === list.id ? (
                            <Check className="h-5 w-5 text-orange" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Mensagens */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>Crie suas Mensagens</CardTitle>
                <CardDescription>
                  Adicione até 10 variações de mensagem com texto, imagem, áudio ou vídeo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">
                          Mensagem {index + 1}
                        </Label>
                        {message.media && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange/10 text-orange text-xs rounded-full">
                            {getMediaTypeIcon(message.media.type)}
                            {message.media.type === "image"
                              ? "Imagem"
                              : message.media.type === "audio"
                              ? "Áudio"
                              : "Vídeo"}
                          </span>
                        )}
                      </div>
                      {messages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMessage(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      )}
                    </div>

                    <textarea
                      className="w-full min-h-[100px] p-3 border rounded-md resize-none bg-background"
                      placeholder="Digite sua mensagem aqui..."
                      value={message.content}
                      onChange={(e) => updateMessageContent(index, e.target.value)}
                    />

                    <MediaUpload
                      currentMedia={message.media}
                      onUpload={(media) => updateMessageMedia(index, media)}
                      onRemove={() => updateMessageMedia(index, null)}
                    />
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  {messages.length < 10 && (
                    <Button variant="outline" onClick={addMessage}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Mensagem
                    </Button>
                  )}
                  {messages.length < 10 && templates.length > 0 && (
                    <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Usar Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Selecionar Template</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {templates.map((template) => (
                            <div
                              key={template.id}
                              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => addFromTemplate(template)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-orange" />
                                <span className="font-medium">{template.name}</span>
                              </div>
                              {template.category && (
                                <span className="inline-block px-2 py-0.5 bg-muted text-xs rounded-full mb-2">
                                  {template.category}
                                </span>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.content}
                              </p>
                              {template.mediaType && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-orange/10 text-orange text-xs rounded-full">
                                  {template.mediaType === "image" ? (
                                    <Image className="h-3 w-3" />
                                  ) : template.mediaType === "audio" ? (
                                    <FileAudio className="h-3 w-3" />
                                  ) : (
                                    <Video className="h-3 w-3" />
                                  )}
                                  {template.mediaType === "image"
                                    ? "Imagem"
                                    : template.mediaType === "audio"
                                    ? "Áudio"
                                    : "Vídeo"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Gerar Variações com IA
                  </Button>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Dicas:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <li>• Use variáveis como {"{nome}"} para personalizar mensagens</li>
                    <li>• Adicione imagens para chamar mais atenção</li>
                    <li>• Áudios parecem mais pessoais e humanizados</li>
                    <li>• Cada mensagem pode ter um tipo de mídia diferente</li>
                  </ul>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Intervalo */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>Configure o Intervalo e Agendamento</CardTitle>
                <CardDescription>
                  Defina o tempo entre mensagens e quando a campanha deve iniciar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minInterval">Intervalo Mínimo (segundos)</Label>
                    <Input
                      id="minInterval"
                      type="number"
                      min={30}
                      max={300}
                      value={minInterval}
                      onChange={(e) => setMinInterval(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxInterval">Intervalo Máximo (segundos)</Label>
                    <Input
                      id="maxInterval"
                      type="number"
                      min={30}
                      max={300}
                      value={maxInterval}
                      onChange={(e) => setMaxInterval(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Agendamento */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-orange" />
                      <div>
                        <p className="font-medium">Agendar Campanha</p>
                        <p className="text-sm text-muted-foreground">
                          Inicie a campanha em uma data e hora específica
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={scheduleEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setScheduleEnabled(!scheduleEnabled);
                        if (scheduleEnabled) {
                          setScheduledAt("");
                        }
                      }}
                    >
                      {scheduleEnabled ? "Ativado" : "Desativado"}
                    </Button>
                  </div>

                  {scheduleEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt">Data e Hora de Início</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A campanha será iniciada automaticamente no horário definido
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Recomendações Anti-Bloqueio</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Mínimo recomendado: 30 segundos</li>
                    <li>• Máximo recomendado: 90-120 segundos</li>
                    <li>• Use pelo menos 5 variações de mensagem</li>
                    <li>• Distribua entre 2-3 números de WhatsApp</li>
                    <li>• Agende para horários comerciais (9h-18h)</li>
                  </ul>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: WhatsApps */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle>Selecione os WhatsApps</CardTitle>
                <CardDescription>
                  Escolha quais números serão usados para o disparo (selecione um ou mais)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingWhatsapps ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : whatsapps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Nenhum WhatsApp cadastrado</p>
                    <p className="text-sm">
                      Adicione seus números em &quot;Configurações&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {whatsapps.map((wa) => (
                      <div
                        key={wa.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedWhatsAppIds.includes(wa.id)
                            ? "border-orange bg-orange/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleWhatsApp(wa.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                            <Smartphone className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">{wa.name || wa.phoneNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {wa.phoneNumber} •{" "}
                              <span
                                className={
                                  wa.status === "connected"
                                    ? "text-green-500"
                                    : "text-yellow-500"
                                }
                              >
                                {wa.status === "connected" ? "Conectado" : "Desconectado"}
                              </span>
                            </p>
                          </div>
                        </div>
                        {selectedWhatsAppIds.includes(wa.id) ? (
                          <Check className="h-5 w-5 text-orange" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                    {selectedWhatsAppIds.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-4">
                        {selectedWhatsAppIds.length} número(s) selecionado(s)
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <>
              <CardHeader>
                <CardTitle>Revisar Campanha</CardTitle>
                <CardDescription>
                  Verifique os detalhes antes de iniciar o disparo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{campaignName || "Não definido"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Lista</span>
                    <span className="font-medium">
                      {selectedList
                        ? `${selectedList.name} (${selectedList.totalContacts} contatos)`
                        : "Nenhuma selecionada"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Mensagens</span>
                    <div className="text-right">
                      <span className="font-medium">{messages.filter(m => m.content.trim()).length} variações</span>
                      {messages.some(m => m.media) && (
                        <div className="flex items-center justify-end gap-2 mt-1">
                          {messages.filter(m => m.media?.type === "image").length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Image className="h-3 w-3" />
                              {messages.filter(m => m.media?.type === "image").length}
                            </span>
                          )}
                          {messages.filter(m => m.media?.type === "audio").length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileAudio className="h-3 w-3" />
                              {messages.filter(m => m.media?.type === "audio").length}
                            </span>
                          )}
                          {messages.filter(m => m.media?.type === "video").length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Video className="h-3 w-3" />
                              {messages.filter(m => m.media?.type === "video").length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Intervalo</span>
                    <span className="font-medium">{minInterval}s - {maxInterval}s</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Agendamento</span>
                    <span className="font-medium">
                      {scheduleEnabled && scheduledAt
                        ? new Date(scheduledAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Iniciar imediatamente"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">WhatsApps</span>
                    <span className="font-medium">
                      {selectedWhatsApps.length > 0
                        ? selectedWhatsApps.map((w) => w.name || w.phoneNumber).join(", ")
                        : "Nenhum selecionado"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="orange"
                  className="w-full gap-2"
                  disabled={!canCreate() || creating}
                  onClick={handleCreateCampaign}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {creating ? "Criando..." : "Criar Campanha"}
                </Button>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between p-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <Button
              variant="orange"
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              disabled={currentStep === 5}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
