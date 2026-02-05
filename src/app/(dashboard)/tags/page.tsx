"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/hooks/use-permission";
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  X,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  _count: {
    contacts: number;
  };
}

// Color palette for tags
const TAG_COLORS = [
  "#6B7280", // Gray
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#84CC16", // Lime
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
];

export default function TagsPage() {
  const { can } = usePermission();
  const canCreate = can("lists:create");
  const canDelete = can("lists:delete");

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch tags
  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Open create dialog
  const openCreate = () => {
    setEditingTag(null);
    setTagName("");
    setTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setDialogOpen(true);
  };

  // Save tag (create or update)
  const handleSave = async () => {
    if (!tagName.trim()) return;

    setSaving(true);
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
      const method = editingTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tagName.trim(),
          color: tagColor,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setEditingTag(null);
        setTagName("");
        fetchTags();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao salvar tag");
      }
    } catch (error) {
      alert("Erro ao salvar tag");
    } finally {
      setSaving(false);
    }
  };

  // Delete tag
  const handleDelete = async () => {
    if (!deleteTag) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/tags/${deleteTag.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDeleteTag(null);
        fetchTags();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao excluir tag");
      }
    } catch (error) {
      alert("Erro ao excluir tag");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Header
        title="Tags"
        description="Organize seus contatos com tags personalizadas"
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-orange" />
                  Tags da Organizacao
                </CardTitle>
                <CardDescription>
                  Use tags para categorizar e segmentar seus contatos
                </CardDescription>
              </div>
              {canCreate && (
                <Button variant="orange" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tag
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma tag criada</p>
                <p className="text-sm mb-4">Crie tags para organizar seus contatos</p>
                {canCreate && (
                  <Button variant="orange" onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Tag
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <p className="font-medium">{tag.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {tag._count.contacts} contato{tag._count.contacts !== 1 && "s"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(tag)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTag(tag)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dicas de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>Use tags para segmentar contatos por interesse, origem ou status</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>Filtre contatos por tags ao criar campanhas direcionadas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>Tags como "Quente", "Morno", "Frio" podem ser aplicadas automaticamente pelo Lead Scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>Um contato pode ter multiplas tags simultaneamente</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Editar Tag" : "Nova Tag"}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? "Atualize o nome ou cor da tag"
                : "Crie uma nova tag para organizar seus contatos"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Nome da Tag</Label>
              <Input
                id="tagName"
                placeholder="Ex: Cliente VIP, Interessado, Novo Lead"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTagColor(color)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      tagColor === color ? "scale-110 ring-2 ring-offset-2 ring-orange" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {tagColor === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-full text-white"
                  style={{ backgroundColor: tagColor }}
                >
                  {tagName || "Nome da Tag"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="orange"
              onClick={handleSave}
              disabled={!tagName.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingTag ? (
                "Salvar"
              ) : (
                "Criar Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Tag</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a tag "{deleteTag?.name}"?
              {deleteTag && deleteTag._count.contacts > 0 && (
                <span className="block mt-2 text-yellow-600">
                  Esta tag esta associada a {deleteTag._count.contacts} contato(s).
                  A associacao sera removida, mas os contatos serao mantidos.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTag(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
