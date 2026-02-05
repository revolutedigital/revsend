"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Shield,
  Users,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
}

interface OrgSelectorProps {
  collapsed?: boolean;
}

export function OrgSelector({ collapsed = false }: OrgSelectorProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Fetch user's organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
        }
      } catch {
        // Silently fail
      }
    };

    if (session?.user) {
      fetchOrgs();
    }
  }, [session?.user]);

  // Get current organization
  const currentOrg = organizations.find(
    (org) => org.id === session?.user?.currentOrgId
  );

  // Switch organization
  const switchOrg = async (orgId: string) => {
    if (orgId === session?.user?.currentOrgId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (response.ok) {
        // Update session with new org
        await update({ currentOrgId: orgId });
        router.refresh();
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  // Create new organization
  const createOrg = async () => {
    if (!newOrgName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations((prev) => [...prev, data.organization]);
        setNewOrgName("");
        setIsCreating(false);
        // Switch to new org
        await switchOrg(data.organization.id);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === "master") return Shield;
    if (role === "gerente") return Building2;
    return Users;
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      master: { label: "Master", color: "bg-purple-500/20 text-purple-300" },
      gerente: { label: "Gerente", color: "bg-blue-500/20 text-blue-300" },
      vendedor: { label: "Vendedor", color: "bg-green-500/20 text-green-300" },
    };
    return badges[role] || badges.vendedor;
  };

  if (!session?.user) return null;

  // Collapsed mode - just show icon
  if (collapsed) {
    return (
      <div className="px-2 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg bg-navy-400/30 hover:bg-navy-400/50 transition-colors"
          title={currentOrg?.name || "Selecionar organização"}
        >
          <Building2 className="h-5 w-5 text-navy-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-2">
      {/* Selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg bg-navy-400/30 hover:bg-navy-400/50 transition-colors text-left",
          isOpen && "bg-navy-400/50"
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#ff7336]/20 flex items-center justify-center">
          <Building2 className="h-4 w-4 text-[#ff7336]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentOrg?.name || "Selecione uma org"}
          </p>
          {currentOrg && (
            <p className="text-xs text-navy-300">
              {getRoleBadge(session.user.role).label}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-navy-300 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-navy-600 border border-navy-400/50 rounded-lg shadow-xl overflow-hidden">
            {/* Organizations list */}
            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => {
                const isSelected = org.id === session?.user?.currentOrgId;
                const badge = getRoleBadge(org.role);
                const Icon = getRoleIcon(org.role);

                return (
                  <button
                    key={org.id}
                    onClick={() => switchOrg(org.id)}
                    disabled={isLoading}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-navy-500/50 transition-colors text-left",
                      isSelected && "bg-navy-500/30"
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-navy-500 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-navy-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {org.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded",
                            badge.color
                          )}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-navy-400">
                          {org.memberCount} membro{org.memberCount !== 1 && "s"}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-[#ff7336]" />
                    )}
                  </button>
                );
              })}

              {organizations.length === 0 && !isCreating && (
                <div className="p-4 text-center text-sm text-navy-300">
                  Nenhuma organização encontrada
                </div>
              )}
            </div>

            {/* Create new org */}
            <div className="border-t border-navy-400/30">
              {isCreating ? (
                <div className="p-3">
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Nome da organização"
                    className="w-full px-3 py-2 bg-navy-500 border border-navy-400 rounded-lg text-sm text-white placeholder-navy-300 focus:outline-none focus:border-[#ff7336]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createOrg();
                      if (e.key === "Escape") {
                        setIsCreating(false);
                        setNewOrgName("");
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={createOrg}
                      disabled={!newOrgName.trim() || isLoading}
                      className="flex-1 py-2 bg-[#ff7336] text-white text-sm font-medium rounded-lg hover:bg-[#ff7336]/90 disabled:opacity-50 transition-colors"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewOrgName("");
                      }}
                      className="px-4 py-2 text-navy-300 text-sm hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-navy-500/50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-navy-500 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-navy-200" />
                  </div>
                  <span className="text-sm text-navy-200">
                    Criar organização
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
