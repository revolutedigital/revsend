import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api-handler'
import { db } from '@/lib/db'

export const GET = apiHandler(async (_req, { session }) => {
  const progress = await db.onboardingProgress.findUnique({
    where: { userId: session!.user.id },
  })

  if (!progress) {
    return NextResponse.json({
      currentStep: 0,
      completedSteps: [],
      skipped: false,
      completedAt: null,
    })
  }

  return NextResponse.json(progress)
})

export const POST = apiHandler(async (req: NextRequest, { session }) => {
  const body = await req.json()
  const { currentStep, completedSteps, skipped } = body

  const progress = await db.onboardingProgress.upsert({
    where: { userId: session!.user.id },
    update: {
      ...(currentStep !== undefined && { currentStep }),
      ...(completedSteps !== undefined && { completedSteps }),
      ...(skipped !== undefined && { skipped }),
      ...(skipped || (completedSteps && completedSteps.length >= 5)
        ? { completedAt: new Date() }
        : {}),
    },
    create: {
      userId: session!.user.id,
      currentStep: currentStep ?? 0,
      completedSteps: completedSteps ?? [],
      skipped: skipped ?? false,
    },
  })

  return NextResponse.json(progress)
})
