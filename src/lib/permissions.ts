/**
 * RBAC Permission System for Multi-Tenant RevSend
 *
 * Roles:
 * - master: Super-admin global, accesses all organizations
 * - gerente: Full access within own organization
 * - vendedor: Limited access - read-only campaigns, own deals only
 */

export type Role = 'master' | 'gerente' | 'vendedor'

export type Action =
  // Campaigns
  | 'campaigns:read'
  | 'campaigns:create'
  | 'campaigns:update'
  | 'campaigns:delete'
  | 'campaigns:start'
  // Contact Lists
  | 'lists:read'
  | 'lists:create'
  | 'lists:update'
  | 'lists:delete'
  // Contacts
  | 'contacts:read'
  | 'contacts:create'
  | 'contacts:update'
  | 'contacts:delete'
  // Tags
  | 'tags:read'
  | 'tags:create'
  | 'tags:update'
  | 'tags:delete'
  // Templates
  | 'templates:read'
  | 'templates:create'
  | 'templates:update'
  | 'templates:delete'
  // WhatsApp
  | 'whatsapp:read'
  | 'whatsapp:connect'
  | 'whatsapp:disconnect'
  // Deals (CRM)
  | 'deals:read'
  | 'deals:read_own' // Vendedor: only assigned deals
  | 'deals:create'
  | 'deals:update'
  | 'deals:delete'
  | 'deals:assign'
  // Pipeline
  | 'pipeline:read'
  | 'pipeline:create'
  | 'pipeline:update'
  | 'pipeline:delete'
  // Reports
  | 'reports:read'
  | 'reports:read_own'
  // Webhooks
  | 'webhooks:read'
  | 'webhooks:create'
  | 'webhooks:update'
  | 'webhooks:delete'
  // Media
  | 'media:read'
  | 'media:upload'
  | 'media:delete'
  // Organization
  | 'org:read'
  | 'org:update'
  | 'members:read'
  | 'members:manage'
  | 'members:invite'
  // Blacklist
  | 'blacklist:read'
  | 'blacklist:manage'
  // Roulette
  | 'roulette:read'
  | 'roulette:manage'
  // Notifications
  | 'notifications:read'
  | 'notifications:manage'
  // Audit
  | 'audit:read'
  // Admin (Master only)
  | 'admin:access'
  | 'admin:orgs'
  | 'admin:users'

/**
 * Permission matrix for each role
 */
const PERMISSIONS: Record<Role, Action[]> = {
  master: [
    // Master has ALL permissions
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete', 'campaigns:start',
    'lists:read', 'lists:create', 'lists:update', 'lists:delete',
    'contacts:read', 'contacts:create', 'contacts:update', 'contacts:delete',
    'tags:read', 'tags:create', 'tags:update', 'tags:delete',
    'templates:read', 'templates:create', 'templates:update', 'templates:delete',
    'whatsapp:read', 'whatsapp:connect', 'whatsapp:disconnect',
    'deals:read', 'deals:read_own', 'deals:create', 'deals:update', 'deals:delete', 'deals:assign',
    'pipeline:read', 'pipeline:create', 'pipeline:update', 'pipeline:delete',
    'reports:read', 'reports:read_own',
    'webhooks:read', 'webhooks:create', 'webhooks:update', 'webhooks:delete',
    'media:read', 'media:upload', 'media:delete',
    'org:read', 'org:update',
    'members:read', 'members:manage', 'members:invite',
    'blacklist:read', 'blacklist:manage',
    'roulette:read', 'roulette:manage',
    'notifications:read', 'notifications:manage',
    'audit:read',
    'admin:access', 'admin:orgs', 'admin:users',
  ],
  gerente: [
    // Gerente has full access within organization (no admin)
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete', 'campaigns:start',
    'lists:read', 'lists:create', 'lists:update', 'lists:delete',
    'contacts:read', 'contacts:create', 'contacts:update', 'contacts:delete',
    'tags:read', 'tags:create', 'tags:update', 'tags:delete',
    'templates:read', 'templates:create', 'templates:update', 'templates:delete',
    'whatsapp:read', 'whatsapp:connect', 'whatsapp:disconnect',
    'deals:read', 'deals:read_own', 'deals:create', 'deals:update', 'deals:delete', 'deals:assign',
    'pipeline:read', 'pipeline:create', 'pipeline:update', 'pipeline:delete',
    'reports:read', 'reports:read_own',
    'webhooks:read', 'webhooks:create', 'webhooks:update', 'webhooks:delete',
    'media:read', 'media:upload', 'media:delete',
    'org:read', 'org:update',
    'members:read', 'members:manage', 'members:invite',
    'blacklist:read', 'blacklist:manage',
    'roulette:read', 'roulette:manage',
    'notifications:read', 'notifications:manage',
    'audit:read',
  ],
  vendedor: [
    // Vendedor has limited access - read-only campaigns, own deals
    'campaigns:read', // Read only
    'lists:read', // Read only
    'contacts:read', // Read only
    'tags:read', // Read only
    'templates:read', // Read only
    'whatsapp:read', // Read only
    'deals:read_own', // Only assigned deals
    'deals:create', // Can create deals
    'deals:update', // Can update own deals
    'pipeline:read', // Read only
    'reports:read_own', // Own reports only
    'media:read', // Read only
    'org:read', // Read org info
    'members:read', // See team members
    'notifications:read', // Own notifications
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, action: Action): boolean {
  const permissions = PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(action)
}

/**
 * Get effective role based on user's isMaster flag and org role
 */
export function getEffectiveRole(isMaster: boolean, orgRole: string | null): Role {
  if (isMaster) return 'master'
  if (!orgRole) return 'vendedor' // Default if no org role
  if (orgRole === 'gerente') return 'gerente'
  return 'vendedor'
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Action[] {
  return PERMISSIONS[role] || []
}

/**
 * Check if user can access all deals or only their own
 */
export function canAccessAllDeals(role: Role): boolean {
  return hasPermission(role, 'deals:read')
}

/**
 * Check if user can manage organization members
 */
export function canManageMembers(role: Role): boolean {
  return hasPermission(role, 'members:manage')
}

/**
 * Check if user has admin access (Master only)
 */
export function isAdmin(role: Role): boolean {
  return hasPermission(role, 'admin:access')
}

/**
 * Get role display name (Portuguese)
 */
export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    master: 'Administrador Master',
    gerente: 'Gerente',
    vendedor: 'Vendedor',
  }
  return names[role] || role
}

/**
 * Get role description (Portuguese)
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    master: 'Acesso total ao sistema, todas as organizações',
    gerente: 'Acesso total dentro da organização',
    vendedor: 'Visualiza campanhas, gerencia seus próprios negócios',
  }
  return descriptions[role] || ''
}

/**
 * Filter actions by prefix
 */
export function getActionsForResource(resource: string): Action[] {
  const allActions: Action[] = [
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete', 'campaigns:start',
    'lists:read', 'lists:create', 'lists:update', 'lists:delete',
    'contacts:read', 'contacts:create', 'contacts:update', 'contacts:delete',
    'tags:read', 'tags:create', 'tags:update', 'tags:delete',
    'templates:read', 'templates:create', 'templates:update', 'templates:delete',
    'whatsapp:read', 'whatsapp:connect', 'whatsapp:disconnect',
    'deals:read', 'deals:read_own', 'deals:create', 'deals:update', 'deals:delete', 'deals:assign',
    'pipeline:read', 'pipeline:create', 'pipeline:update', 'pipeline:delete',
    'reports:read', 'reports:read_own',
    'webhooks:read', 'webhooks:create', 'webhooks:update', 'webhooks:delete',
    'media:read', 'media:upload', 'media:delete',
    'org:read', 'org:update',
    'members:read', 'members:manage', 'members:invite',
    'blacklist:read', 'blacklist:manage',
    'roulette:read', 'roulette:manage',
    'notifications:read', 'notifications:manage',
    'audit:read',
    'admin:access', 'admin:orgs', 'admin:users',
  ]
  return allActions.filter(action => action.startsWith(`${resource}:`))
}

/**
 * Validate that a role string is valid
 */
export function isValidRole(role: string): role is Role {
  return ['master', 'gerente', 'vendedor'].includes(role)
}

/**
 * Check multiple permissions at once (ANY)
 */
export function hasAnyPermission(role: Role, actions: Action[]): boolean {
  return actions.some(action => hasPermission(role, action))
}

/**
 * Check multiple permissions at once (ALL)
 */
export function hasAllPermissions(role: Role, actions: Action[]): boolean {
  return actions.every(action => hasPermission(role, action))
}
