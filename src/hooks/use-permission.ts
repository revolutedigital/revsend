"use client";

import { useSession } from "next-auth/react";
import { hasPermission, getEffectiveRole, Action, Role } from "@/lib/permissions";

/**
 * Hook to check user's role and permissions
 */
export function usePermission() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  // Get effective role
  const role: Role = session?.user
    ? getEffectiveRole(session.user.isMaster, session.user.currentOrgRole)
    : "vendedor";

  // Check if user has a specific permission
  const can = (action: Action): boolean => {
    if (!session?.user) return false;
    return hasPermission(role, action);
  };

  // Check if user has any of the specified permissions
  const canAny = (actions: Action[]): boolean => {
    if (!session?.user) return false;
    return actions.some((action) => hasPermission(role, action));
  };

  // Check if user has all of the specified permissions
  const canAll = (actions: Action[]): boolean => {
    if (!session?.user) return false;
    return actions.every((action) => hasPermission(role, action));
  };

  return {
    // State
    isLoading,
    isAuthenticated,
    role,
    isMaster: session?.user?.isMaster ?? false,
    isGerente: role === "gerente",
    isVendedor: role === "vendedor",

    // Organization
    organizationId: session?.user?.currentOrgId ?? null,
    hasOrganization: !!session?.user?.currentOrgId,

    // Permission checkers
    can,
    canAny,
    canAll,

    // Common permission shortcuts
    canManageCampaigns: can("campaigns:create"),
    canManageLists: can("lists:create"),
    canManageTemplates: can("templates:create"),
    canManageMembers: can("members:manage"),
    canAccessAdmin: can("admin:access"),
    canManageDeals: can("deals:read"), // Full access vs read_own
  };
}

/**
 * Simple hook to get just the role
 */
export function useRole(): Role {
  const { data: session } = useSession();

  if (!session?.user) return "vendedor";

  return getEffectiveRole(session.user.isMaster, session.user.currentOrgRole);
}
