import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTwoFactorSecret } from '@/lib/auth/2fa'

/**
 * POST /api/auth/2fa/setup
 * Generate 2FA secret and QR code
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate 2FA secret
    const twoFactorSetup = await generateTwoFactorSecret(session.user.email)

    return NextResponse.json({
      qrCodeUrl: twoFactorSetup.qrCodeUrl,
      manualEntryKey: twoFactorSetup.manualEntryKey,
      secret: twoFactorSetup.secret, // Store this temporarily in session or state
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}
