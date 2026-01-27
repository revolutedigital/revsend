import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyTwoFactorToken } from '@/lib/auth/2fa'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createAuditLogFromRequest } from '@/lib/audit/audit-logger'

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA (requires password confirmation)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    // Create audit log
    await createAuditLogFromRequest(user.id, 'user.2fa_disable')

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    })
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 })
  }
}
