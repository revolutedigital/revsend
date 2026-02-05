import { db } from './db'

// Default opt-out keywords (fallback if no org-specific keywords)
const DEFAULT_OPT_OUT_KEYWORDS = ['sair', 'parar', 'cancelar', 'stop', 'unsubscribe', 'remover', 'não quero', 'pare']

/**
 * Check if a phone number is blacklisted in an organization
 */
export async function isBlacklisted(organizationId: string, phoneNumber: string): Promise<boolean> {
  const entry = await db.blacklist.findUnique({
    where: {
      organizationId_phoneNumber: { organizationId, phoneNumber }
    }
  })
  return !!entry
}

/**
 * Add a phone number to the organization's blacklist
 */
export async function addToBlacklist(organizationId: string, phoneNumber: string, reason: string, addedBy?: string) {
  return db.blacklist.upsert({
    where: {
      organizationId_phoneNumber: { organizationId, phoneNumber }
    },
    update: { reason },
    create: { organizationId, phoneNumber, reason, addedBy },
  })
}

/**
 * Remove a phone number from the organization's blacklist
 */
export async function removeFromBlacklist(organizationId: string, phoneNumber: string): Promise<boolean> {
  try {
    await db.blacklist.delete({
      where: {
        organizationId_phoneNumber: { organizationId, phoneNumber }
      }
    })
    return true
  } catch {
    return false
  }
}

/**
 * Get blacklist keywords for an organization (with defaults)
 */
export async function getBlacklistKeywords(organizationId: string): Promise<string[]> {
  const orgKeywords = await db.blacklistKeyword.findMany({
    where: { organizationId },
    select: { keyword: true },
  })

  if (orgKeywords.length === 0) {
    return DEFAULT_OPT_OUT_KEYWORDS
  }

  return orgKeywords.map((k) => k.keyword)
}

/**
 * Check if a message contains opt-out keywords (simple check with default keywords)
 */
export function containsOptOutKeyword(message: string): boolean {
  const lower = message.toLowerCase().trim()
  return DEFAULT_OPT_OUT_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + ' '))
}

/**
 * Check if a message contains opt-out keywords for a specific organization
 */
export async function containsOrgOptOutKeyword(organizationId: string, message: string): Promise<boolean> {
  const keywords = await getBlacklistKeywords(organizationId)
  const lower = message.toLowerCase().trim()

  return keywords.some((kw) => {
    const kwLower = kw.toLowerCase()
    // Match exact keyword or keyword at start of message
    return lower === kwLower || lower.startsWith(kwLower + ' ') || lower.includes(' ' + kwLower + ' ') || lower.endsWith(' ' + kwLower)
  })
}

/**
 * Record consent for a phone number
 */
export async function recordConsent(
  phoneNumber: string,
  consentType: string,
  granted: boolean,
  source?: string,
  ipAddress?: string,
  organizationId?: string
) {
  return db.contactConsent.upsert({
    where: { phoneNumber_consentType: { phoneNumber, consentType } },
    update: {
      granted,
      ...(granted ? { grantedAt: new Date() } : { revokedAt: new Date() }),
      source,
      ipAddress,
      organizationId,
    },
    create: {
      phoneNumber,
      consentType,
      granted,
      grantedAt: granted ? new Date() : null,
      source,
      ipAddress,
      organizationId,
    },
  })
}

/**
 * Check if a phone number has active consent
 */
export async function hasConsent(phoneNumber: string, consentType: string): Promise<boolean> {
  const consent = await db.contactConsent.findUnique({
    where: { phoneNumber_consentType: { phoneNumber, consentType } },
  })
  return consent?.granted ?? false
}

/**
 * Process opt-out from an incoming message
 * Returns true if the message triggered an opt-out
 */
export async function processOptOut(organizationId: string, phoneNumber: string, message: string): Promise<boolean> {
  // Check organization-specific keywords
  const isOptOut = await containsOrgOptOutKeyword(organizationId, message)

  if (!isOptOut) return false

  // Add to blacklist
  await addToBlacklist(organizationId, phoneNumber, `keyword: ${message.toLowerCase().trim().substring(0, 50)}`, 'system')

  // Record consent revocation
  await recordConsent(phoneNumber, 'marketing', false, 'opt-out', undefined, organizationId)

  return true
}

/**
 * Get blacklist statistics for an organization
 */
export async function getBlacklistStats(organizationId: string) {
  const [totalBlacklisted, keywordOptOuts, manualOptOuts, totalKeywords] = await Promise.all([
    db.blacklist.count({ where: { organizationId } }),
    db.blacklist.count({ where: { organizationId, reason: { startsWith: 'keyword' } } }),
    db.blacklist.count({ where: { organizationId, reason: 'manual' } }),
    db.blacklistKeyword.count({ where: { organizationId } }),
  ])

  return {
    totalBlacklisted,
    keywordOptOuts,
    manualOptOuts,
    totalKeywords,
  }
}
