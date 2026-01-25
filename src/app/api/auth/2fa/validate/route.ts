import { NextRequest, NextResponse } from 'next/server'
import { verifyTwoFactorToken } from '@/lib/auth/2fa'
import { prisma } from '@/lib/db'

/**
 * POST /api/auth/2fa/validate
 * Validate 2FA token during login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

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
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 400 })
    }

    // Verify the token
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
