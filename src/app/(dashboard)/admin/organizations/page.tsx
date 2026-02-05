"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Plus,
  Search,
  Users,
  Send,
  Briefcase,
  Loader2,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  membersCount: number;
  campaignsCount: number;
  dealsCount: number;
  createdAt: string;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPlan, setNewPlan] = useState("free");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });
      const response = await fetch(`/api/admin/organizations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [pagination.page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchOrganizations();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          plan: newPlan,
          ownerEmail: newOwnerEmail.trim() || undefined,
        }),
      });

      if (response.ok) {
        setCreateOpen(false);
        setNewName("");
        setNewSlug("");
        setNewPlan("free");
        setNewOwnerEmail("");
        fetchOrganizations();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao criar organizacao");
      }
    } catch (error) {
      alert("Erro ao criar organizacao");
    } finally {
      setCreating(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, { label: string; color: string }> = {
      free: { label: "Free", color: "bg-gray-500/10 text-gray-500" },
      pro: { label: "Pro", color: "bg-blue-500/10 text-blue-500" },
      enterprise: { label: "Enterprise", color: "bg-purple-500/10 text-purple-500" },
    };
    return plans[plan] || plans.free;
  };

  return (
    <>
      <Header
        title="Organizacoes"
        description="Gerencie todas as organizacoes do sistema"
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange" />
                  Todas as Organizacoes
                </CardTitle>
                <CardDescription>
                  {pagination.total} organizacoes cadastradas
                </CardDescription>
              </div>
              <Button variant="orange" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Organizacao
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou slug..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma organizacao encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => {
                  const planBadge = getPlanBadge(org.plan);
                  return (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-orange/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-orange" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{org.name}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${planBadge.color}`}>
                              {planBadge.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">/{org.slug}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {org.membersCount} membros
                            </span>
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              {org.campaignsCount} campanhas
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {org.dealsCount} deals
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(org.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/organizations/${org.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Organizacao</DialogTitle>
            <DialogDescription>
              Crie uma nova organizacao e defina o proprietario inicial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome da Organizacao"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="nome-da-organizacao"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
              <p className="text-xs text-muted-foreground">
                Identificador unico para URLs
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <select
                id="plan"
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email do Proprietario (opcional)</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para ser o proprietario (voce)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="orange"
              onClick={handleCreate}
              disabled={!newName.trim() || !newSlug.trim() || creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Organizacao"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
