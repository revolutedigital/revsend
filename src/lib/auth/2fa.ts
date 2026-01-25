import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

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
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  return code.match(/.{1,4}/g)?.join('-') || code
}

/**
 * Generate multiple backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateBackupCode())
}
