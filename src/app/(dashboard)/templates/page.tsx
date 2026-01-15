"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MediaUpload } from "@/components/campaigns/MediaUpload";
import {
  FileText,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Image,
  FileAudio,
  Video,
  Copy,
  Tag,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string | null;
  content: string;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
  timesUsed: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: "", label: "Sem categoria" },
  { value: "prospecção", label: "Prospecção" },
  { value: "follow-up", label: "Follow-up" },
  { value: "lembrete", label: "Lembrete" },
  { value: "promocional", label: "Promocional" },
  { value: "informativo", label: "Informativo" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<{
    url: string;
    type: "image" | "audio" | "video";
    name: string;
  } | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Erro ao buscar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setName("");
    setCategory("");
    setContent("");
    setMedia(null);
    setEditingTemplate(null);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setCategory(template.category || "");
    setContent(template.content);
    if (template.mediaType && template.mediaUrl && template.mediaName) {
      setMedia({
        type: template.mediaType as "image" | "audio" | "video",
        url: template.mediaUrl,
        name: template.mediaName,
      });
    } else {
      setMedia(null);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name,
        category: category || null,
        content,
        mediaType: media?.type || null,
        mediaUrl: media?.url || null,
        mediaName: media?.name || null,
      };

      const url = editingTemplate
        ? `/api/templates/${editingTemplate.id}`
        : "/api/templates";
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchTemplates();
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao salvar template:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Erro ao excluir template:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMediaIcon = (type: string | null) => {
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

  return (
    <>
      <Header
        title="Templates"
        description="Biblioteca de mensagens reutilizáveis"
      />

      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Meus Templates</CardTitle>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="orange" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Editar Template" : "Novo Template"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Template</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Apresentação inicial"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <select
                        id="category"
                        className="w-full h-10 px-3 border rounded-md bg-background"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Mensagem</Label>
                    <textarea
                      id="content"
                      className="w-full min-h-[150px] p-3 border rounded-md resize-none bg-background"
                      placeholder="Digite sua mensagem aqui...&#10;Use {nome} para personalizar"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mídia (opcional)</Label>
                    <MediaUpload
                      currentMedia={media}
                      onUpload={(m) => setMedia(m)}
                      onRemove={() => setMedia(null)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="orange"
                      onClick={handleSubmit}
                      disabled={saving || !name.trim() || !content.trim()}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : editingTemplate ? (
                        "Salvar Alterações"
                      ) : (
                        "Criar Template"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum template criado ainda</p>
                <p className="text-sm">
                  Crie templates para reutilizar em suas campanhas
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange" />
                        <h3 className="font-medium">{template.name}</h3>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(template.content)}
                          title="Copiar mensagem"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {template.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-xs rounded-full">
                          <Tag className="h-3 w-3" />
                          {template.category}
                        </span>
                      )}
                      {template.mediaType && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange/10 text-orange text-xs rounded-full">
                          {getMediaIcon(template.mediaType)}
                          {template.mediaType === "image"
                            ? "Imagem"
                            : template.mediaType === "audio"
                            ? "Áudio"
                            : "Vídeo"}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {template.content}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Usado {template.timesUsed} vez
                      {template.timesUsed !== 1 ? "es" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
