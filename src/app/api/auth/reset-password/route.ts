import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { isResetTokenExpired, validatePasswordStrength } from '@/lib/auth/password-reset'
import bcrypt from 'bcryptjs'
import { createAuditLogFromRequest } from '@/lib/audit/audit-logger'
import { rateLimit, RATE_LIMITS, getRateLimitIdentifier } from '@/lib/rate-limit'

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request)
    const rl = await rateLimit(`reset-password:${identifier}`, RATE_LIMITS.LOGIN)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', errors: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    // Check if token is expired
    if (isResetTokenExpired(user.passwordResetExpiresAt)) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    })

    // Create audit log
    await createAuditLogFromRequest(user.id, 'user.password_reset_complete', undefined, undefined, {
      email: user.email,
    })

    console.log(`Password reset successful for user: ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
}
