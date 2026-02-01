import { db } from './db'

const OPT_OUT_KEYWORDS = ['sair', 'parar', 'cancelar', 'stop', 'unsubscribe', 'remover', 'não quero']

/**
 * Check if a phone number is blacklisted
 */
export async function isBlacklisted(phoneNumber: string): Promise<boolean> {
  const entry = await db.blacklist.findUnique({ where: { phoneNumber } })
  return !!entry
}

/**
 * Add a phone number to the blacklist
 */
export async function addToBlacklist(phoneNumber: string, reason: string, addedBy?: string) {
  return db.blacklist.upsert({
    where: { phoneNumber },
    update: { reason },
    create: { phoneNumber, reason, addedBy },
  })
}

/**
 * Check if a message contains opt-out keywords
 */
export function containsOptOutKeyword(message: string): boolean {
  const lower = message.toLowerCase().trim()
  return OPT_OUT_KEYWORDS.some((kw) => lower === kw || lower.startsWith(kw + ' '))
}

/**
 * Record consent for a phone number
 */
export async function recordConsent(
  phoneNumber: string,
  consentType: string,
  granted: boolean,
  source?: string,
  ipAddress?: string
) {
  return db.contactConsent.upsert({
    where: { phoneNumber_consentType: { phoneNumber, consentType } },
    update: {
      granted,
      ...(granted ? { grantedAt: new Date() } : { revokedAt: new Date() }),
      source,
      ipAddress,
    },
    create: {
      phoneNumber,
      consentType,
      granted,
      grantedAt: granted ? new Date() : null,
      source,
      ipAddress,
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
 */
export async function processOptOut(phoneNumber: string, message: string): Promise<boolean> {
  if (!containsOptOutKeyword(message)) return false

  await addToBlacklist(phoneNumber, 'keyword', 'system')
  await recordConsent(phoneNumber, 'marketing', false, 'opt-out')
  return true
}
