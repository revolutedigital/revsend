import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyTwoFactorToken, encryptTwoFactorSecret } from '@/lib/auth/2fa'
import { db as prisma } from '@/lib/db'
import { createAuditLogFromRequest } from '@/lib/audit/audit-logger'

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token and enable 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, secret } = body

    if (!token || !secret) {
      return NextResponse.json({ error: 'Missing token or secret' }, { status: 400 })
    }

    // Verify the token
    const isValid = verifyTwoFactorToken(secret, token)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enable 2FA and save secret
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptTwoFactorSecret(secret),
      },
    })

    // Create audit log
    await createAuditLogFromRequest(user.id, 'user.2fa_enable')

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    })
  } catch (error) {
    console.error('Error verifying 2FA:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
