/**
 * Lead Roulette - Weighted Round-Robin Lead Distribution
 *
 * Distributes new leads among salespeople based on configurable weights.
 * Higher weight = more leads assigned.
 */

import { db } from './db'

export interface RouletteConfig {
  enabled: boolean
  strategy: 'round_robin' | 'weighted_round_robin' | 'manual'
}

export interface UserWeight {
  userId: string
  userName: string | null
  userEmail: string
  weight: number
  isActive: boolean
  leadsAssigned: number
}

/**
 * Get or create roulette config for an organization
 */
async function getOrCreateConfig(organizationId: string) {
  let config = await db.leadRouletteConfig.findUnique({
    where: { organizationId },
  })

  if (!config) {
    config = await db.leadRouletteConfig.create({
      data: {
        organizationId,
        enabled: false,
        strategy: 'weighted_round_robin',
      },
    })
  }

  return config
}

/**
 * Get roulette configuration for an organization
 */
export async function getRouletteConfig(organizationId: string): Promise<RouletteConfig | null> {
  const config = await db.leadRouletteConfig.findUnique({
    where: { organizationId },
  })

  if (!config) return null

  return {
    enabled: config.enabled,
    strategy: config.strategy as RouletteConfig['strategy'],
  }
}

/**
 * Update roulette configuration
 */
export async function updateRouletteConfig(
  organizationId: string,
  config: Partial<RouletteConfig>
): Promise<RouletteConfig> {
  const updated = await db.leadRouletteConfig.upsert({
    where: { organizationId },
    update: {
      enabled: config.enabled,
      strategy: config.strategy,
    },
    create: {
      organizationId,
      enabled: config.enabled ?? false,
      strategy: config.strategy ?? 'weighted_round_robin',
    },
  })

  return {
    enabled: updated.enabled,
    strategy: updated.strategy as RouletteConfig['strategy'],
  }
}

/**
 * Get all user weights for an organization
 */
export async function getUserWeights(organizationId: string): Promise<UserWeight[]> {
  // Get or create config
  const config = await getOrCreateConfig(organizationId)

  // Get all members of the organization
  const members = await db.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  // Get existing weights for this config
  const weights = await db.leadRouletteWeight.findMany({
    where: { rouletteId: config.id },
  })

  const weightsMap = new Map(weights.map((w) => [w.userId, w]))

  // Count assigned leads for each user
  const leadCounts = await db.deal.groupBy({
    by: ['assignedToId'],
    where: {
      organizationId,
      assignedToId: { not: null },
    },
    _count: true,
  })

  const leadCountsMap = new Map(leadCounts.map((c) => [c.assignedToId, c._count]))

  // Merge data
  return members.map((member) => {
    const weight = weightsMap.get(member.userId)
    return {
      userId: member.userId,
      userName: member.user.name,
      userEmail: member.user.email,
      weight: weight?.weight ?? 1, // Default weight of 1
      isActive: weight?.active ?? true, // Default active
      leadsAssigned: leadCountsMap.get(member.userId) || 0,
    }
  })
}

/**
 * Set weight for a user
 */
export async function setUserWeight(
  organizationId: string,
  userId: string,
  weight: number,
  isActive: boolean
): Promise<void> {
  // Verify user is member of organization
  const member = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  })

  if (!member) {
    throw new Error('Usuário não é membro desta organização')
  }

  // Get or create config
  const config = await getOrCreateConfig(organizationId)

  await db.leadRouletteWeight.upsert({
    where: {
      rouletteId_userId: { rouletteId: config.id, userId },
    },
    update: { weight, active: isActive },
    create: { rouletteId: config.id, userId, weight, active: isActive },
  })
}

/**
 * Delete weight for a user (resets to default)
 */
export async function deleteUserWeight(organizationId: string, userId: string): Promise<void> {
  const config = await db.leadRouletteConfig.findUnique({
    where: { organizationId },
  })

  if (!config) return

  await db.leadRouletteWeight.deleteMany({
    where: { rouletteId: config.id, userId },
  })
}

/**
 * Get next user in weighted round-robin
 * Returns userId to assign the lead to, or null if no one available
 */
export async function getNextAssignee(organizationId: string): Promise<string | null> {
  // Get config
  const config = await getRouletteConfig(organizationId)

  if (!config || !config.enabled) {
    return null // Roulette disabled, manual assignment
  }

  // Get roulette config with ID
  const rouletteConfig = await db.leadRouletteConfig.findUnique({
    where: { organizationId },
  })

  if (!rouletteConfig) return null

  // Get active users with weights
  const weights = await db.leadRouletteWeight.findMany({
    where: {
      rouletteId: rouletteConfig.id,
      active: true,
    },
    include: {
      user: {
        select: { id: true },
      },
    },
  })

  // If no weights configured, get all org members
  if (weights.length === 0) {
    const members = await db.organizationMember.findMany({
      where: { organizationId },
      select: { userId: true },
    })

    if (members.length === 0) return null

    // Simple round-robin for members without weights
    const lastAssigned = await db.deal.findFirst({
      where: { organizationId, assignedToId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { assignedToId: true },
    })

    if (!lastAssigned?.assignedToId) {
      return members[0].userId
    }

    const lastIndex = members.findIndex((m) => m.userId === lastAssigned.assignedToId)
    const nextIndex = (lastIndex + 1) % members.length
    return members[nextIndex].userId
  }

  // Weighted round-robin algorithm
  if (config.strategy === 'weighted_round_robin') {
    // Get lead counts for each user
    const leadCounts = await db.deal.groupBy({
      by: ['assignedToId'],
      where: {
        organizationId,
        assignedToId: { in: weights.map((w) => w.userId) },
      },
      _count: true,
    })

    const countsMap = new Map(leadCounts.map((c) => [c.assignedToId, c._count]))

    // Calculate expected vs actual distribution
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
    const totalLeads = leadCounts.reduce((sum, c) => sum + c._count, 0)

    // Find user most "behind" their expected share
    let bestUserId: string | null = null
    let bestDeficit = -Infinity

    for (const w of weights) {
      const expectedShare = w.weight / totalWeight
      const actualCount = countsMap.get(w.userId) || 0
      const expectedCount = totalLeads * expectedShare

      // Deficit = how many leads behind they are
      const deficit = expectedCount - actualCount

      if (deficit > bestDeficit) {
        bestDeficit = deficit
        bestUserId = w.userId
      }
    }

    return bestUserId
  }

  // Simple round-robin (equal distribution)
  const userIds = weights.map((w) => w.userId)

  const lastAssigned = await db.deal.findFirst({
    where: {
      organizationId,
      assignedToId: { in: userIds },
    },
    orderBy: { createdAt: 'desc' },
    select: { assignedToId: true },
  })

  if (!lastAssigned?.assignedToId) {
    return userIds[0]
  }

  const lastIndex = userIds.indexOf(lastAssigned.assignedToId)
  const nextIndex = (lastIndex + 1) % userIds.length
  return userIds[nextIndex]
}

/**
 * Assign a lead to the next user in rotation
 * Returns the assigned user ID
 */
export async function assignLead(organizationId: string, dealId: string): Promise<string | null> {
  const assigneeId = await getNextAssignee(organizationId)

  if (!assigneeId) {
    return null
  }

  await db.deal.update({
    where: { id: dealId },
    data: { assignedToId: assigneeId },
  })

  // Update assign count
  const config = await db.leadRouletteConfig.findUnique({
    where: { organizationId },
  })

  if (config) {
    await db.leadRouletteWeight.updateMany({
      where: { rouletteId: config.id, userId: assigneeId },
      data: {
        assignCount: { increment: 1 },
        lastAssignedAt: new Date(),
      },
    })
  }

  return assigneeId
}

/**
 * Get roulette statistics
 */
export async function getRouletteStats(organizationId: string) {
  const config = await getRouletteConfig(organizationId)
  const weights = await getUserWeights(organizationId)

  const activeUsers = weights.filter((w) => w.isActive)
  const totalLeads = weights.reduce((sum, w) => sum + w.leadsAssigned, 0)
  const totalWeight = activeUsers.reduce((sum, w) => sum + w.weight, 0)

  // Calculate expected vs actual distribution
  const distribution = activeUsers.map((w) => {
    const expectedShare = totalWeight > 0 ? (w.weight / totalWeight) * 100 : 0
    const actualShare = totalLeads > 0 ? (w.leadsAssigned / totalLeads) * 100 : 0

    return {
      userId: w.userId,
      userName: w.userName,
      weight: w.weight,
      leadsAssigned: w.leadsAssigned,
      expectedShare: expectedShare.toFixed(1) + '%',
      actualShare: actualShare.toFixed(1) + '%',
      deviation: (actualShare - expectedShare).toFixed(1) + '%',
    }
  })

  return {
    enabled: config?.enabled ?? false,
    strategy: config?.strategy ?? 'weighted_round_robin',
    activeUsers: activeUsers.length,
    totalUsers: weights.length,
    totalLeads,
    distribution,
  }
}
