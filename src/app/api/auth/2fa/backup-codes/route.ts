import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateBackupCodes, hashBackupCodes } from '@/lib/auth/2fa'
import { db as prisma } from '@/lib/db'
import { createAuditLogFromRequest } from '@/lib/audit/audit-logger'

/**
 * POST /api/auth/2fa/backup-codes
 * Generate new backup codes (regenerates and replaces existing codes)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA must be enabled to generate backup codes' },
        { status: 400 }
      )
    }

    // Generate new backup codes
    const plainCodes = generateBackupCodes(10)
    const hashedCodes = hashBackupCodes(plainCodes)

    // Save hashed codes to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorBackupCodes: hashedCodes,
      },
    })

    // Create audit log
    await createAuditLogFromRequest(user.id, 'user.2fa_enable', undefined, undefined, {
      action: 'backup_codes_generated',
      count: plainCodes.length,
    })

    // Return plain codes (only time they're shown to user)
    return NextResponse.json({
      success: true,
      codes: plainCodes,
      message: 'Backup codes generated. Store them securely - they will not be shown again.',
    })
  } catch (error) {
    console.error('Error generating backup codes:', error)
    return NextResponse.json({ error: 'Failed to generate backup codes' }, { status: 500 })
  }
}

/**
 * GET /api/auth/2fa/backup-codes
 * Get count of remaining backup codes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled,
      remainingCodes: user.twoFactorBackupCodes.length,
    })
  } catch (error) {
    console.error('Error getting backup codes count:', error)
    return NextResponse.json({ error: 'Failed to get backup codes' }, { status: 500 })
  }
}
