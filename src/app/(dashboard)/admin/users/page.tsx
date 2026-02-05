"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserCog,
  Search,
  Loader2,
  Shield,
  Building2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserOrg {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  isMaster: boolean;
  emailVerified: string | null;
  createdAt: string;
  organizations: UserOrg[];
  organizationsCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMaster, setFilterMaster] = useState<string>("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [togglingMaster, setTogglingMaster] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filterMaster && { isMaster: filterMaster }),
      });
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filterMaster]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchUsers();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleMaster = async (userId: string, currentValue: boolean) => {
    if (!confirm(
      currentValue
        ? "Remover privilégios Master deste usuário?"
        : "Tornar este usuário Master? Ele terá acesso total ao sistema."
    )) {
      return;
    }

    setTogglingMaster(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMaster: !currentValue }),
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || "Erro ao atualizar usuario");
      }
    } catch (error) {
      alert("Erro ao atualizar usuario");
    } finally {
      setTogglingMaster(null);
    }
  };

  return (
    <>
      <Header
        title="Usuarios"
        description="Gerencie todos os usuarios do sistema"
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-orange" />
                  Todos os Usuarios
                </CardTitle>
                <CardDescription>
                  {pagination.total} usuarios cadastrados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterMaster}
                  onChange={(e) => setFilterMaster(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Todos</option>
                  <option value="true">Apenas Masters</option>
                  <option value="false">Nao Masters</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
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
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum usuario encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        user.isMaster ? "bg-purple-500/10" : "bg-blue-500/10"
                      }`}>
                        {user.isMaster ? (
                          <Shield className="h-6 w-6 text-purple-500" />
                        ) : (
                          <UserCog className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name || "Sem nome"}</p>
                          {user.isMaster && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-500">
                              Master
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                          {user.emailVerified ? (
                            <span title="Email verificado">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            </span>
                          ) : (
                            <span title="Email nao verificado">
                              <XCircle className="h-3 w-3 text-yellow-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {user.organizationsCount} organizacoes
                          {user.organizations.slice(0, 3).map((org) => (
                            <span key={org.id} className="px-1.5 py-0.5 bg-muted rounded text-xs">
                              {org.name} ({org.role})
                            </span>
                          ))}
                          {user.organizationsCount > 3 && (
                            <span className="text-xs">+{user.organizationsCount - 3} mais</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), {
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
                          <DropdownMenuItem
                            onClick={() => toggleMaster(user.id, user.isMaster)}
                            disabled={togglingMaster === user.id}
                          >
                            {togglingMaster === user.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4 mr-2" />
                            )}
                            {user.isMaster ? "Remover Master" : "Tornar Master"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
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
    </>
  );
}
