import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import crypto from 'crypto'
import { encrypt, decrypt } from '../encryption'

const APP_NAME = 'RevSend'

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
}

/**
 * Generate a new 2FA secret and QR code
 */
export async function generateTwoFactorSecret(email: string): Promise<TwoFactorSetup> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    length: 32,
  })

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate OTP auth URL')
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey: secret.base32,
  }
}

/**
 * Verify a 2FA token
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after (60 seconds total)
  })
}

/**
 * Generate a backup code (for account recovery)
 */
export function generateBackupCode(): string {
  const bytes = crypto.randomBytes(5)
  const code = bytes.toString('hex').substring(0, 8).toUpperCase()
  return code.match(/.{1,4}/g)?.join('-') || code
}

/**
 * Generate multiple backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateBackupCode())
}

/**
 * Hash a backup code for secure storage
 */
export function hashBackupCode(code: string): string {
  // Normalize the code (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase()
  return crypto.createHash('sha256').update(normalizedCode).digest('hex')
}

/**
 * Hash multiple backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(hashBackupCode)
}

/**
 * Verify a backup code against stored hashed codes
 * Returns the index of the matched code, or -1 if not found
 */
export function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): { valid: boolean; index: number } {
  const hashedInput = hashBackupCode(inputCode)
  const index = hashedCodes.findIndex((hashed) => hashed === hashedInput)
  return {
    valid: index !== -1,
    index,
  }
}

/**
 * Format backup codes for display (add dashes)
 */
export function formatBackupCode(code: string): string {
  const clean = code.replace(/-/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join('-') || clean
}

/**
 * Encrypt a 2FA secret for secure database storage
 */
export function encryptTwoFactorSecret(secret: string): string {
  return encrypt(secret)
}

/**
 * Decrypt a 2FA secret from database storage
 */
export function decryptTwoFactorSecret(encryptedSecret: string): string {
  return decrypt(encryptedSecret)
}
