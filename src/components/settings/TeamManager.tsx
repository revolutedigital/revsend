"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  UserPlus,
  Loader2,
  MoreHorizontal,
  Copy,
  Link as LinkIcon,
  Mail,
  Shield,
  Clock,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string;
}

interface Invite {
  id: string;
  email: string | null;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function TeamManager() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteType, setInviteType] = useState<"email" | "link">("email");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("vendedor");
  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Member actions
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);

  const currentOrgId = session?.user?.currentOrgId;
  const currentRole = session?.user?.role;
  const canManage = currentRole === "gerente" || session?.user?.isMaster;

  const fetchMembers = async () => {
    if (!currentOrgId) return;
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/organizations/${currentOrgId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchInvites = async () => {
    if (!currentOrgId || !canManage) return;
    setLoadingInvites(true);
    try {
      const response = await fetch(`/api/organizations/${currentOrgId}/invites`);
      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [currentOrgId]);

  const handleCreateInvite = async () => {
    if (inviteType === "email" && !inviteEmail.trim()) return;

    setCreating(true);
    setGeneratedLink(null);
    try {
      const response = await fetch(`/api/organizations/${currentOrgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteType === "email" ? inviteEmail.trim() : undefined,
          role: inviteRole,
          type: inviteType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (inviteType === "link") {
          setGeneratedLink(data.invite.inviteUrl);
        } else {
          setInviteOpen(false);
          setInviteEmail("");
          fetchInvites();
        }
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao criar convite");
      }
    } catch (error) {
      alert("Erro ao criar convite");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingMember(userId);
    try {
      const response = await fetch(`/api/organizations/${currentOrgId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao atualizar role");
      }
    } catch (error) {
      alert("Erro ao atualizar role");
    } finally {
      setUpdatingMember(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro da equipe?")) return;

    setRemovingMember(userId);
    try {
      const response = await fetch(
        `/api/organizations/${currentOrgId}/members?userId=${userId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchMembers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao remover membro");
      }
    } catch (error) {
      alert("Erro ao remover membro");
    } finally {
      setRemovingMember(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingInvite(inviteId);
    try {
      const response = await fetch(
        `/api/organizations/${currentOrgId}/invites/${inviteId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchInvites();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao cancelar convite");
      }
    } catch (error) {
      alert("Erro ao cancelar convite");
    } finally {
      setCancellingInvite(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string }> = {
      gerente: { label: "Gerente", color: "bg-blue-500/10 text-blue-500" },
      vendedor: { label: "Vendedor", color: "bg-green-500/10 text-green-500" },
    };
    return roles[role] || roles.vendedor;
  };

  if (!session?.user?.currentOrgId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Selecione uma organizacao para ver a equipe</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Invite button */}
      {canManage && (
        <div className="flex justify-end">
          <Button variant="orange" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Membros ({members.length})
        </h4>
        {loadingMembers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum membro encontrado</p>
          </div>
        ) : (
          members.map((member) => {
            const badge = getRoleBadge(member.role);
            const isCurrentUser = member.userId === session?.user?.id;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {member.name || member.email}
                        {isCurrentUser && (
                          <span className="text-muted-foreground ml-1">(você)</span>
                        )}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                {canManage && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={updatingMember === member.userId || removingMember === member.userId}
                      >
                        {updatingMember === member.userId || removingMember === member.userId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === "vendedor" ? (
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, "gerente")}>
                          <Shield className="h-4 w-4 mr-2" />
                          Promover a Gerente
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, "vendedor")}>
                          <Users className="h-4 w-4 mr-2" />
                          Rebaixar para Vendedor
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover da Equipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pending Invites */}
      {canManage && invites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Convites Pendentes ({invites.length})
          </h4>
          {loadingInvites ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            invites.map((invite) => {
              const badge = getRoleBadge(invite.role);
              return (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border border-dashed rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {invite.email || "Convite por link"}
                        </p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expira {formatDistanceToNow(new Date(invite.expiresAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCancelInvite(invite.id)}
                    disabled={cancellingInvite === invite.id}
                    className="text-red-500 hover:text-red-600"
                  >
                    {cancellingInvite === invite.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => {
        setInviteOpen(open);
        if (!open) {
          setGeneratedLink(null);
          setInviteEmail("");
          setInviteType("email");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>
              Convide um novo membro para sua equipe
            </DialogDescription>
          </DialogHeader>

          {generatedLink ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                  Link de convite gerado!
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Compartilhe este link com quem você deseja convidar. O link expira em 30 dias.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" onClick={handleCopyLink}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setInviteOpen(false);
                  setGeneratedLink(null);
                  fetchInvites();
                }}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {/* Invite Type */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteType("email")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors",
                      inviteType === "email"
                        ? "border-orange bg-orange/10"
                        : "border-muted hover:bg-muted/50"
                    )}
                  >
                    <Mail className={cn("h-4 w-4", inviteType === "email" && "text-orange")} />
                    <span className={cn("text-sm", inviteType === "email" && "text-orange font-medium")}>
                      Por Email
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteType("link")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors",
                      inviteType === "link"
                        ? "border-orange bg-orange/10"
                        : "border-muted hover:bg-muted/50"
                    )}
                  >
                    <LinkIcon className={cn("h-4 w-4", inviteType === "link" && "text-orange")} />
                    <span className={cn("text-sm", inviteType === "link" && "text-orange font-medium")}>
                      Por Link
                    </span>
                  </button>
                </div>

                {/* Email input (only for email type) */}
                {inviteType === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                )}

                {/* Role select */}
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Papel na Equipe</Label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === "vendedor"
                      ? "Vendedores podem ver campanhas, gerenciar seus deals e receber leads."
                      : "Gerentes têm acesso completo à organização e podem gerenciar a equipe."}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="orange"
                  onClick={handleCreateInvite}
                  disabled={(inviteType === "email" && !inviteEmail.trim()) || creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {inviteType === "link" ? "Gerando..." : "Enviando..."}
                    </>
                  ) : inviteType === "link" ? (
                    "Gerar Link"
                  ) : (
                    "Enviar Convite"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
