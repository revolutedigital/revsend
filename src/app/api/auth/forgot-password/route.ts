import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { generateResetToken, getResetTokenExpiration } from '@/lib/auth/password-reset'
import { createAuditLogFromRequest } from '@/lib/audit/audit-logger'

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const expiresAt = getResetTokenExpiration()

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      },
    })

    // Create audit log
    await createAuditLogFromRequest(user.id, 'user.password_reset_request', undefined, undefined, {
      email: user.email,
    })

    // TODO: Send email with reset link
    // For now, we'll log the token (in production, send via email service)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    console.log('='.repeat(80))
    console.log('PASSWORD RESET REQUESTED')
    console.log('='.repeat(80))
    console.log(`Email: ${email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`Token: ${resetToken}`)
    console.log(`Expires: ${expiresAt.toISOString()}`)
    console.log('='.repeat(80))

    // In production, send email here
    // await sendPasswordResetEmail(user.email, resetUrl)

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Only in development:
      ...(process.env.NODE_ENV === 'development' && { resetUrl, resetToken }),
    })
  } catch (error) {
    console.error('Error in forgot password:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
