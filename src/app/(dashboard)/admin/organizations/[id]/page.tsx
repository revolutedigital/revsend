"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Users,
  Send,
  Briefcase,
  FileText,
  Smartphone,
  MessageSquare,
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  UserPlus,
  Shield,
  MoreHorizontal,
  Save,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    isMaster: boolean;
    createdAt: string;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  members: Member[];
  stats: {
    membersCount: number;
    campaignsCount: number;
    activeCampaigns: number;
    listsCount: number;
    dealsCount: number;
    templatesCount: number;
    whatsappNumbersCount: number;
    totalContacts: number;
    totalMessages: number;
  };
}

export default function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [saving, setSaving] = useState(false);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("vendedor");
  const [addingMember, setAddingMember] = useState(false);

  // Delete confirmation
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  // Member actions
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const fetchOrganization = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setEditName(data.organization.name);
        setEditSlug(data.organization.slug);
        setEditPlan(data.organization.plan);
      } else {
        const data = await response.json();
        setError(data.error || "Erro ao carregar organizacao");
      }
    } catch (err) {
      setError("Erro ao carregar organizacao");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          plan: editPlan,
        }),
      });

      if (response.ok) {
        setEditing(false);
        fetchOrganization();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (err) {
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;

    setAddingMember(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole,
        }),
      });

      if (response.ok) {
        setAddMemberOpen(false);
        setNewMemberEmail("");
        setNewMemberRole("vendedor");
        fetchOrganization();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao adicionar membro");
      }
    } catch (err) {
      alert("Erro ao adicionar membro");
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    setUpdatingMember(memberId);
    try {
      const response = await fetch(`/api/admin/organizations/${id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (response.ok) {
        fetchOrganization();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao atualizar role");
      }
    } catch (err) {
      alert("Erro ao atualizar role");
    } finally {
      setUpdatingMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return;

    setRemovingMember(memberId);
    try {
      const response = await fetch(
        `/api/admin/organizations/${id}/members?memberId=${memberId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchOrganization();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao remover membro");
      }
    } catch (err) {
      alert("Erro ao remover membro");
    } finally {
      setRemovingMember(null);
    }
  };

  const handleDeleteOrg = async () => {
    setDeletingOrg(true);
    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/organizations");
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao deletar organizacao");
      }
    } catch (err) {
      alert("Erro ao deletar organizacao");
    } finally {
      setDeletingOrg(false);
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

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      gerente: { label: "Gerente", color: "bg-blue-500/10 text-blue-500" },
      vendedor: { label: "Vendedor", color: "bg-green-500/10 text-green-500" },
    };
    return roles[role] || roles.vendedor;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || "Organizacao nao encontrada"}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/admin/organizations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planBadge = getPlanBadge(organization.plan);

  return (
    <>
      <Header
        title={organization.name}
        description={`/${organization.slug}`}
      />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" asChild>
          <Link href="/admin/organizations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Organizacoes
          </Link>
        </Button>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-orange/10 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-orange" />
                </div>
                <div>
                  {editing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xl font-semibold mb-1"
                    />
                  ) : (
                    <CardTitle className="text-xl">{organization.name}</CardTitle>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {editing ? (
                      <Input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                        className="w-48"
                      />
                    ) : (
                      <span className="text-muted-foreground">/{organization.slug}</span>
                    )}
                    {editing ? (
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value)}
                        className="h-8 px-2 rounded border text-sm"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${planBadge.color}`}>
                        {planBadge.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button variant="orange" onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="destructive" onClick={() => setDeleteOrgOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Criada em</p>
                <p className="font-medium">
                  {format(new Date(organization.createdAt), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Atualizada</p>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(organization.updatedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{organization.stats.membersCount}</p>
                  <p className="text-xs text-muted-foreground">Membros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{organization.stats.campaignsCount}</p>
                  <p className="text-xs text-muted-foreground">Campanhas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{organization.stats.dealsCount}</p>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-orange" />
                <div>
                  <p className="text-2xl font-bold">{organization.stats.totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Mensagens</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-teal-500" />
                <div>
                  <p className="text-2xl font-bold">{organization.stats.whatsappNumbersCount}</p>
                  <p className="text-xs text-muted-foreground">WhatsApps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange" />
                  Membros ({organization.members.length})
                </CardTitle>
                <CardDescription>
                  Gerencie os membros desta organizacao
                </CardDescription>
              </div>
              <Button variant="orange" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organization.members.map((member) => {
                const roleBadge = getRoleBadge(member.role);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        member.user.isMaster ? "bg-purple-500/10" : "bg-blue-500/10"
                      }`}>
                        {member.user.isMaster ? (
                          <Shield className="h-5 w-5 text-purple-500" />
                        ) : (
                          <Users className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user.name || member.user.email}</p>
                          {member.user.isMaster && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/10 text-purple-500">
                              Master
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{member.user.email}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={updatingMember === member.id || removingMember === member.id}>
                          {updatingMember === member.id || removingMember === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role === "vendedor" ? (
                          <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, "gerente")}>
                            Promover a Gerente
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, "vendedor")}>
                            Rebaixar para Vendedor
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600"
                        >
                          Remover da Organizacao
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
            <DialogDescription>
              Adicione um usuario existente a esta organizacao
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email do Usuario</Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberRole">Role</Label>
              <select
                id="memberRole"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="vendedor">Vendedor</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="orange"
              onClick={handleAddMember}
              disabled={!newMemberEmail.trim() || addingMember}
            >
              {addingMember ? (
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

      {/* Delete Organization Dialog */}
      <Dialog open={deleteOrgOpen} onOpenChange={setDeleteOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Organizacao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar "{organization.name}"? Esta acao
              ira remover todos os dados relacionados (campanhas, deals, contatos, etc.)
              e nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOrgOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrg}
              disabled={deletingOrg}
            >
              {deletingOrg ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar Organizacao"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
