import { NextRequest, NextResponse } from 'next/server'
import { verifyTwoFactorToken, verifyBackupCode } from '@/lib/auth/2fa'
import { prisma } from '@/lib/db'
import { createAuditLogFromRequest } from '@/lib/audit/audit-logger'

/**
 * POST /api/auth/2fa/validate
 * Validate 2FA token or backup code during login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, isBackupCode } = body

    if (!email || !token) {
      return NextResponse.json({ error: 'Missing email or token' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 400 })
    }

    // Check if using backup code
    if (isBackupCode) {
      const backupResult = verifyBackupCode(token, user.twoFactorBackupCodes)

      if (!backupResult.valid) {
        return NextResponse.json({ error: 'Invalid backup code' }, { status: 400 })
      }

      // Remove used backup code
      const updatedCodes = [...user.twoFactorBackupCodes]
      updatedCodes.splice(backupResult.index, 1)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: updatedCodes,
        },
      })

      // Log backup code usage
      await createAuditLogFromRequest(user.id, 'user.2fa_verify', undefined, undefined, {
        method: 'backup_code',
        remainingCodes: updatedCodes.length,
      })

      return NextResponse.json({
        success: true,
        message: '2FA validated with backup code',
        remainingBackupCodes: updatedCodes.length,
      })
    }

    // Verify the TOTP token
    const isValid = verifyTwoFactorToken(user.twoFactorSecret, token)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: '2FA token validated',
    })
  } catch (error) {
    console.error('Error validating 2FA:', error)
    return NextResponse.json({ error: 'Failed to validate 2FA' }, { status: 500 })
  }
}
