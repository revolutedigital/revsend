"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermission } from "@/hooks/use-permission";
import {
  Ban,
  Plus,
  Search,
  Trash2,
  Loader2,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BlacklistNumber {
  id: string;
  phoneNumber: string;
  reason: string | null;
  keyword: string | null;
  createdAt: string;
}

interface BlacklistKeyword {
  id: string;
  keyword: string;
  createdAt: string;
}

export default function BlacklistPage() {
  const { can } = usePermission();
  const canManage = can("blacklist:manage");

  // State for numbers
  const [numbers, setNumbers] = useState<BlacklistNumber[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(true);
  const [searchNumbers, setSearchNumbers] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // State for keywords
  const [keywords, setKeywords] = useState<BlacklistKeyword[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(true);

  // State for adding
  const [addNumberOpen, setAddNumberOpen] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingNumber, setAddingNumber] = useState(false);

  const [addKeywordOpen, setAddKeywordOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);

  // State for deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"numbers" | "keywords">("numbers");

  // Fetch blacklisted numbers
  const fetchNumbers = async () => {
    setLoadingNumbers(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchNumbers && { search: searchNumbers }),
      });
      const response = await fetch(`/api/blacklist/numbers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNumbers(data.numbers || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching blacklist:", error);
    } finally {
      setLoadingNumbers(false);
    }
  };

  // Fetch keywords
  const fetchKeywords = async () => {
    setLoadingKeywords(true);
    try {
      const response = await fetch("/api/blacklist/keywords");
      if (response.ok) {
        const data = await response.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error("Error fetching keywords:", error);
    } finally {
      setLoadingKeywords(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
    fetchKeywords();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "numbers") {
        fetchNumbers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchNumbers, pagination.page]);

  // Add number to blacklist
  const handleAddNumber = async () => {
    if (!newNumber.trim()) return;

    setAddingNumber(true);
    try {
      const response = await fetch("/api/blacklist/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: newNumber.trim(),
          reason: newReason.trim() || "manual",
        }),
      });

      if (response.ok) {
        setNewNumber("");
        setNewReason("");
        setAddNumberOpen(false);
        fetchNumbers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao adicionar número");
      }
    } catch (error) {
      alert("Erro ao adicionar número");
    } finally {
      setAddingNumber(false);
    }
  };

  // Add keyword
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;

    setAddingKeyword(true);
    try {
      const response = await fetch("/api/blacklist/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });

      if (response.ok) {
        setNewKeyword("");
        setAddKeywordOpen(false);
        fetchKeywords();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao adicionar palavra-chave");
      }
    } catch (error) {
      alert("Erro ao adicionar palavra-chave");
    } finally {
      setAddingKeyword(false);
    }
  };

  // Delete number from blacklist
  const handleDeleteNumber = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch("/api/blacklist/numbers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchNumbers();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Delete keyword
  const handleDeleteKeyword = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch("/api/blacklist/keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchKeywords();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const getReasonBadge = (reason: string | null, keyword: string | null) => {
    if (keyword) {
      return {
        label: `Palavra: "${keyword}"`,
        color: "bg-orange-500/10 text-orange-500",
        icon: MessageSquare,
      };
    }

    const reasons: Record<string, { label: string; color: string; icon: typeof Ban }> = {
      manual: { label: "Manual", color: "bg-blue-500/10 text-blue-500", icon: Ban },
      opt_out_keyword: { label: "Opt-out", color: "bg-yellow-500/10 text-yellow-500", icon: MessageSquare },
      bounce: { label: "Bounce", color: "bg-red-500/10 text-red-500", icon: AlertTriangle },
      spam_report: { label: "Spam", color: "bg-purple-500/10 text-purple-500", icon: AlertTriangle },
    };

    return reasons[reason || "manual"] || reasons.manual;
  };

  return (
    <>
      <Header
        title="Blacklist"
        description="Gerencie os numeros bloqueados e palavras-chave de opt-out"
      />

      <div className="p-6 space-y-6">
        {/* LGPD Compliance Notice */}
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Conformidade LGPD Ativa
              </p>
              <p className="text-xs text-muted-foreground">
                Contatos que enviam palavras-chave de opt-out sao automaticamente adicionados a blacklist
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("numbers")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "numbers"
                ? "border-orange text-orange"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-4 w-4 inline-block mr-2" />
            Numeros Bloqueados ({pagination.total})
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "keywords"
                ? "border-orange text-orange"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4 inline-block mr-2" />
            Palavras-Chave ({keywords.length})
          </button>
        </div>

        {/* Numbers Tab */}
        {activeTab === "numbers" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5 text-orange" />
                    Numeros Bloqueados
                  </CardTitle>
                  <CardDescription>
                    Numeros que nao receberao mensagens de campanhas
                  </CardDescription>
                </div>
                {canManage && (
                  <Button variant="orange" onClick={() => setAddNumberOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Numero
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por numero ou motivo..."
                  className="pl-10"
                  value={searchNumbers}
                  onChange={(e) => setSearchNumbers(e.target.value)}
                />
              </div>

              {/* List */}
              {loadingNumbers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : numbers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhum numero na blacklist</p>
                  <p className="text-sm">Numeros serao adicionados automaticamente quando contatos solicitarem opt-out</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {numbers.map((entry) => {
                    const badge = getReasonBadge(entry.reason, entry.keyword);
                    const Icon = badge.icon;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium font-mono">{entry.phoneNumber}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${badge.color}`}
                              >
                                <Icon className="h-3 w-3" />
                                {badge.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.createdAt), {
                                  addSuffix: true,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNumber(entry.id)}
                            disabled={deletingId === entry.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Pagina {pagination.page} de {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    Proximo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Keywords Tab */}
        {activeTab === "keywords" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange" />
                    Palavras-Chave de Opt-Out
                  </CardTitle>
                  <CardDescription>
                    Quando um contato envia uma dessas palavras, ele e automaticamente bloqueado
                  </CardDescription>
                </div>
                {canManage && (
                  <Button variant="orange" onClick={() => setAddKeywordOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Palavra
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingKeywords ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : keywords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma palavra-chave configurada</p>
                  <p className="text-sm">Adicione palavras como "pare", "sair", "cancelar" para opt-out automatico</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <div
                      key={kw.id}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-orange/10 text-orange border border-orange/20 rounded-lg"
                    >
                      <span className="font-medium">{kw.keyword}</span>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteKeyword(kw.id)}
                          disabled={deletingId === kw.id}
                          className="text-orange/60 hover:text-orange transition-colors"
                        >
                          {deletingId === kw.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Default keywords info */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Palavras-Chave Recomendadas (LGPD)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Adicione estas palavras para garantir conformidade com a LGPD:
                </p>
                <div className="flex flex-wrap gap-1">
                  {["pare", "parar", "sair", "cancelar", "remover", "stop", "nao quero"].map((word) => {
                    const isAdded = keywords.some((k) => k.keyword.toLowerCase() === word);
                    return (
                      <span
                        key={word}
                        className={`px-2 py-1 text-xs rounded ${
                          isAdded
                            ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                        }`}
                      >
                        {word}
                        {isAdded && <CheckCircle2 className="h-3 w-3 inline ml-1" />}
                      </span>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Number Dialog */}
      <Dialog open={addNumberOpen} onOpenChange={setAddNumberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Numero a Blacklist</DialogTitle>
            <DialogDescription>
              Este numero nao recebera mais mensagens de nenhuma campanha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Numero de Telefone</Label>
              <Input
                id="phoneNumber"
                placeholder="+5511999999999"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Inclua o codigo do pais (ex: +55 para Brasil)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ex: Solicitacao do cliente"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNumberOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="orange"
              onClick={handleAddNumber}
              disabled={!newNumber.trim() || addingNumber}
            >
              {addingNumber ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Keyword Dialog */}
      <Dialog open={addKeywordOpen} onOpenChange={setAddKeywordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Palavra-Chave</DialogTitle>
            <DialogDescription>
              Quando um contato enviar esta palavra, sera automaticamente adicionado a blacklist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyword">Palavra-Chave</Label>
              <Input
                id="keyword"
                placeholder="Ex: parar, sair, cancelar"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A comparacao nao diferencia maiusculas/minusculas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddKeywordOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="orange"
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim() || addingKeyword}
            >
              {addingKeyword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
